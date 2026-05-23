import { useState, useEffect } from 'react';
import { getStories, saveStories, getCurrentUser, CATEGORIES } from '../db/initialData';
import { fetchLatestNews } from '../db/newsApi';

const createImportedStoryObject = (story) => {
  return {
    id: `story_import_${Date.now()}`,
    title: story.title,
    description: story.description,
    category: story.category,
    location: story.location,
    media: story.media,
    reporterId: "imported_stream",
    reporterName: story.reporterName,
    reporterAvatar: story.reporterAvatar,
    date: story.date || new Date().toISOString(),
    status: "pending", // Imported news must go through fact check audits!
    upvotes: story.upvotes || 5,
    upvotedBy: [],
    comments: [],
    flags: [],
    sourceReferences: ["NewsData.io Stream Import", story.source_url || "https://newsdata.io"],
    reviewerComments: "",
    verifiedAt: null,
    verifiedBy: null
  };
};

export default function NewsFeed({ selectedStoryId, clearSelectedStoryId }) {
  const [stories, setStories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [bookmarkedStories, setBookmarkedStories] = useState([]);

  // Live News Stream Integration
  const [feedMode, setFeedMode] = useState('local'); // 'local' or 'live_stream'
  const [liveStories, setLiveStories] = useState([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [importNotification, setImportNotification] = useState(null);

  // Detail Modal State
  const [activeStory, setActiveStory] = useState(null);
  const [readerFontSize, setReaderFontSize] = useState(1); // 1 = normal, 1.2 = large, 1.4 = x-large
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagSubmitted, setFlagSubmitted] = useState(false);

  // Mobile Bottom-Sheet Touch Gestures
  const [touchStartY, setTouchStartY] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStartY;
    // Swipe down by > 120px will dismiss the sheet
    if (diffY > 120) {
      setActiveStory(null);
      if (clearSelectedStoryId) clearSelectedStoryId();
    }
    setTouchStartY(null);
  };

  // Sync data and hook to DB updates
  const loadData = () => {
    setStories(getStories());
    setCurrentUser(getCurrentUser());
  };

  const loadLiveNews = async () => {
    setIsLiveLoading(true);
    setLiveError(null);
    try {
      const results = await fetchLatestNews();
      setLiveStories(results);
    } catch (err) {
      console.warn("Live stream error details:", err);
      setLiveError("Failed to stream live news articles from NewsData.io.");
    } finally {
      setIsLiveLoading(false);
    }
  };

  useEffect(() => {
    if (feedMode === 'live_stream') {
      const timer = setTimeout(() => {
        loadLiveNews();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [feedMode]);

  const handleImportStory = (story, e) => {
    if (e) e.stopPropagation();
    
    // Check if already exists in stories to avoid duplicates
    const allLocal = getStories();
    const isDuplicate = allLocal.some(s => s.title.toLowerCase() === story.title.toLowerCase());
    
    if (isDuplicate) {
      setImportNotification({
        type: 'warning',
        message: '⚠️ This article has already been imported into the platform queue!'
      });
      setTimeout(() => setImportNotification(null), 4000);
      return;
    }

    const newImportedStory = createImportedStoryObject(story);

    const updatedStories = [newImportedStory, ...allLocal];
    saveStories(updatedStories);
    
    setImportNotification({
      type: 'success',
      message: `📥 "${story.title.substring(0, 35)}..." imported! Switch to David Smith (Verifier) role to factcheck and publish.`
    });
    setTimeout(() => setImportNotification(null), 5000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
      
      // Load bookmarks
      const savedBookmarks = localStorage.getItem('citizen_bookmarks');
      if (savedBookmarks) {
        setBookmarkedStories(JSON.parse(savedBookmarks));
      }
    }, 0);
    window.addEventListener('citizen_db_update', loadData);
    window.addEventListener('citizen_user_update', loadData);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('citizen_db_update', loadData);
      window.removeEventListener('citizen_user_update', loadData);
    };
  }, []);

  // Handle external link clicks (e.g. from Map or Dashboard)
  useEffect(() => {
    if (selectedStoryId && stories.length > 0) {
      const story = stories.find(s => s.id === selectedStoryId);
      if (story) {
        const timer = setTimeout(() => {
          setActiveStory(story);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedStoryId, stories]);

  // Load voices when the component mounts
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Sync active narration state and stop audio when activeStory changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTtsPlaying(false);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeStory]);

  const handleUpvote = (storyId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const updated = stories.map(story => {
      if (story.id === storyId) {
        const upvotedBy = story.upvotedBy || [];
        const hasUpvoted = upvotedBy.includes(currentUser.id);
        
        return {
          ...story,
          upvotes: hasUpvoted ? story.upvotes - 1 : story.upvotes + 1,
          upvotedBy: hasUpvoted 
            ? upvotedBy.filter(id => id !== currentUser.id)
            : [...upvotedBy, currentUser.id]
        };
      }
      return story;
    });

    saveStories(updated);
    
    // If active story modal is open, sync modal state
    if (activeStory && activeStory.id === storyId) {
      const activeMatch = updated.find(s => s.id === storyId);
      setActiveStory(activeMatch);
    }
  };

  const handleBookmark = (storyId, e) => {
    if (e) e.stopPropagation();
    let updatedBookmarks;
    if (bookmarkedStories.includes(storyId)) {
      updatedBookmarks = bookmarkedStories.filter(id => id !== storyId);
    } else {
      updatedBookmarks = [...bookmarkedStories, storyId];
    }
    setBookmarkedStories(updatedBookmarks);
    localStorage.setItem('citizen_bookmarks', JSON.stringify(updatedBookmarks));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser || !activeStory) return;

    const newComment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: commentInput,
      date: new Date().toISOString()
    };

    const updated = stories.map(story => {
      if (story.id === activeStory.id) {
        return {
          ...story,
          comments: [...(story.comments || []), newComment]
        };
      }
      return story;
    });

    saveStories(updated);
    setCommentInput('');
    
    // Update active modal view
    const activeMatch = updated.find(s => s.id === activeStory.id);
    setActiveStory(activeMatch);
  };

  const handleReportMisinformation = (e) => {
    e.preventDefault();
    if (!flagReason.trim() || !currentUser || !activeStory) return;

    const newFlag = {
      id: `flag_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      reason: flagReason,
      date: new Date().toISOString()
    };

    const updated = stories.map(story => {
      if (story.id === activeStory.id) {
        return {
          ...story,
          flags: [...(story.flags || []), newFlag]
        };
      }
      return story;
    });

    saveStories(updated);
    setFlagReason('');
    setShowFlagForm(false);
    setFlagSubmitted(true);
    setTimeout(() => setFlagSubmitted(false), 4000);

    // Update active modal view
    const activeMatch = updated.find(s => s.id === activeStory.id);
    setActiveStory(activeMatch);
  };

  const toggleTts = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech narration is not supported in this browser.");
      return;
    }

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
    } else {
      window.speechSynthesis.cancel();

      const introText = `Now playing audio narration for: ${activeStory.title}. Reported by ${activeStory.reporterName}.`;
      const bodyText = activeStory.description;
      const fullText = `${introText} ${bodyText}`;

      const utterance = new SpeechSynthesisUtterance(fullText);
      const voices = window.speechSynthesis.getVoices();

      // Select premium/natural English voice if available
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Microsoft') || voice.name.includes('Apple'))
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setIsTtsPlaying(false);
      };

      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setIsTtsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsTtsPlaying(true);
    }
  };

  const getCategoryObject = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || { name: 'Local News', icon: '📝', color: '#6b7280' };
  };

  const formatStoryDate = (isoString) => {
    if (!isoString) return '';
    const dateObj = new Date(isoString);
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filtration logic for either Local or Live News Stream
  const rawList = feedMode === 'local' ? stories.filter(story => story.status === 'approved') : liveStories;
  const filteredStories = rawList
    .filter(story => {
      const matchSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          story.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCat = selectedCat === 'all' || story.category === selectedCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return 0;
    });

  const getReadTime = (text) => {
    const wpm = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wpm);
    return `${minutes} min read`;
  };

  return (
    <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
      
      {/* Import Notification Toast */}
      {importNotification && (
        <div style={{
          position: 'fixed',
          top: '85px',
          right: '25px',
          background: importNotification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(217, 119, 6, 0.95)',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 99999,
          maxWidth: '380px',
          fontSize: '0.85rem',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {importNotification.message}
        </div>
      )}

      {/* Header and Search Filters */}
      <div className="feed-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {feedMode === 'local' ? '🛡️ Verified Hyperlocal News' : '📡 Live Global Stream'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {feedMode === 'local' 
                ? 'Truth-checked local reporting direct from the citizens in the field.' 
                : 'Real-time global news feed queried directly from the live NewsData.io stream.'
              }
            </p>
          </div>

          {/* Neon Mode Toggle Switch */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '50px',
            padding: '4px',
            gap: '4px'
          }}>
            <button 
              className="btn" 
              onClick={() => setFeedMode('local')}
              style={{
                borderRadius: '50px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: feedMode === 'local' ? 'var(--accent-blue)' : 'transparent',
                color: feedMode === 'local' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: feedMode === 'local' ? '0 0 10px rgba(66, 153, 225, 0.4)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              🌐 Community Reports
            </button>
            <button 
              className="btn" 
              onClick={() => setFeedMode('live_stream')}
              style={{
                borderRadius: '50px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: feedMode === 'live_stream' ? 'var(--accent-amber)' : 'transparent',
                color: feedMode === 'live_stream' ? '#000000' : 'var(--text-muted)',
                boxShadow: feedMode === 'live_stream' ? '0 0 10px rgba(217, 119, 6, 0.4)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              📡 Live Stream
            </button>
          </div>
        </div>

        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <svg className="search-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search reports by topic, location, keyword..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="recent">⏱ Most Recent</option>
              <option value="upvotes">🔥 Trending / Upvotes</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="filter-categories-scroll">
          <div 
            className={`cat-pill ${selectedCat === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCat('all')}
          >
            🌐 All Stories
          </div>
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              className={`cat-pill ${selectedCat === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              <span style={{ marginRight: '0.25rem' }}>{cat.icon}</span>
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {feedMode === 'live_stream' && isLiveLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          background: 'rgba(17, 20, 27, 0.4)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(217, 119, 6, 0.1)',
            borderTop: '3px solid var(--accent-amber)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            boxShadow: '0 0 15px rgba(217, 119, 6, 0.2)'
          }} />
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', letterSpacing: '0.03em' }}>
              📡 Streaming Latest Real-World Reports...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Connecting to NewsData.io stream. Fetching dynamic global news bulletins.
            </p>
          </div>
        </div>
      ) : feedMode === 'live_stream' && liveError ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          border: '1px dashed var(--accent-red)',
          background: 'rgba(229, 62, 98, 0.05)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff'
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h3 style={{ marginTop: '1rem', fontSize: '1.25rem', color: 'var(--accent-red)' }}>Stream Connection Interrupted</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{liveError}</p>
          <button className="btn btn-secondary" onClick={loadLiveNews} style={{ marginTop: '1rem', padding: '0.4rem 1rem', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)' }}>
            🔄 Retry Connection
          </button>
        </div>
      ) : filteredStories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <h3 style={{ marginTop: '1rem', fontSize: '1.25rem' }}>{feedMode === 'local' ? 'No Verified Stories Found' : 'No Live Stream News Match'}</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Try modifying your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {filteredStories.map((story) => {
            const catInfo = getCategoryObject(story.category);
            const isUpvoted = currentUser && (story.upvotedBy || []).includes(currentUser.id);
            const isBookmarked = bookmarkedStories.includes(story.id);

            return (
              <div 
                key={story.id} 
                className="glass-card interactive-hover-blue"
                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => setActiveStory(story)}
              >
                {story.media && story.media.length > 0 && (
                  <img src={story.media[0].url} alt={story.title} className="story-card-image" />
                )}

                <div className="story-card-meta">
                  {story.isLiveStream ? (
                    <span className="status-tag pending" style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)' }}>
                      📡 Live API Stream
                    </span>
                  ) : (
                    <span className="status-tag approved">
                      🛡 Verified News
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                    {getReadTime(story.description)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', color: catInfo.color }}>
                    {catInfo.icon} {catInfo.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    📍 {story.location}
                  </span>
                </div>

                <h3 className="story-card-title">{story.title}</h3>
                <p className="story-card-excerpt">{story.description}</p>

                <div className="story-card-footer">
                  <div className="reporter-avatar-group">
                    <img src={story.reporterAvatar} alt={story.reporterName} className="user-avatar-sm" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{story.reporterName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>{formatStoryDate(story.date)}</div>
                    </div>
                  </div>

                  <div className="engagement-bar">
                    {story.isLiveStream ? (
                      <button 
                        className="btn btn-secondary" 
                        onClick={(e) => handleImportStory(story, e)}
                        style={{
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          border: '1px solid var(--accent-amber)',
                          color: 'var(--accent-amber)',
                          borderRadius: '4px',
                          fontWeight: 700,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      >
                        📥 Import Check
                      </button>
                    ) : (
                      <>
                        <div 
                          className={`engage-item ${isUpvoted ? 'upvoted' : ''}`}
                          onClick={(e) => handleUpvote(story.id, e)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={isUpvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                          </svg>
                          {story.upvotes}
                        </div>
                        
                        <div 
                          className="engage-item"
                          onClick={(e) => handleBookmark(story.id, e)}
                          style={{ color: isBookmarked ? 'var(--accent-amber)' : '' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IMMERSIVE READER DETAIL MODAL */}
      {activeStory && (
        <div className="modal-overlay" onClick={() => { setActiveStory(null); clearSelectedStoryId(); }}>
          <div 
            className="modal-content-shell" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mobile Sheet Drag Handle Indicator */}
            <div style={{
              width: '40px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              margin: '0.5rem auto 1rem auto',
              display: 'block',
              cursor: 'pointer'
            }} />

            <button className="modal-close-btn" onClick={() => { setActiveStory(null); clearSelectedStoryId(); }}>&times;</button>
            
            {/* Header Tools */}
            <div className="immersive-reader-tools">
              <div className="flex-align">
                <span className="status-tag approved" style={{ fontSize: '0.7rem' }}>🛡 VERIFIED REPORT</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>Verified by {activeStory.verifiedBy}</span>
              </div>
              <div className="reader-settings-group">
                <button 
                  className="font-size-btn" 
                  onClick={() => setReaderFontSize(1)}
                  style={{ fontWeight: readerFontSize === 1 ? 'bold' : 'normal' }}
                >
                  aA
                </button>
                <button 
                  className="font-size-btn" 
                  onClick={() => setReaderFontSize(1.25)}
                  style={{ fontSize: '0.9rem', fontWeight: readerFontSize === 1.25 ? 'bold' : 'normal' }}
                >
                  aA+
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={toggleTts}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {isTtsPlaying ? '⏸ Stop Narration' : '🔊 Listen Story'}
                </button>
              </div>
            </div>

            {/* Immersive Body */}
            <div className="immersive-body" style={{ fontSize: `${readerFontSize}rem` }}>
              <div className="immersive-meta-banner">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: getCategoryObject(activeStory.category).color }}>
                    {getCategoryObject(activeStory.category).icon} {getCategoryObject(activeStory.category).name}
                  </span>
                  <span style={{ fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    📍 Location: {activeStory.location}
                  </span>
                </div>
                <h1 className="immersive-title">{activeStory.title}</h1>

                <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginTop: '0.5rem' }}>
                  <div className="reporter-avatar-group">
                    <img src={activeStory.reporterAvatar} alt={activeStory.reporterName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Reported by: {activeStory.reporterName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Published: {formatStoryDate(activeStory.date)}</div>
                    </div>
                  </div>

                  <div className="flex-align" style={{ gap: '1rem' }}>
                    <button 
                      className={`btn btn-secondary ${currentUser && (activeStory.upvotedBy || []).includes(currentUser.id) ? 'upvoted' : ''}`}
                      onClick={() => handleUpvote(activeStory.id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      👍 {activeStory.upvotes} Upvotes
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleBookmark(activeStory.id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: bookmarkedStories.includes(activeStory.id) ? 'var(--accent-amber)' : '' }}
                    >
                      Bookmark
                    </button>
                  </div>
                </div>
              </div>

              {/* TTS Synthesis Active Alert */}
              {isTtsPlaying && (
                <div style={{ background: 'rgba(49,130,206,0.1)', border: '1px solid var(--accent-blue)', color: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                  <span style={{ fontSize: '1.25rem', animation: 'pulseGlow 1.5s infinite' }}>🎙️</span>
                  <span><strong>Audio Narration Active:</strong> Synthesizing high-fidelity audio narration via browser speech API...</span>
                </div>
              )}

              {/* Story Narrative */}
              <p className="immersive-story-text">{activeStory.description}</p>

              {/* Media slider simulation */}
              {activeStory.media && activeStory.media.length > 0 && (
                <div className="immersive-media-gallery">
                  {activeStory.media.map((med, idx) => (
                    <div key={idx}>
                      <img src={med.url} alt={med.caption} className="immersive-gallery-img" />
                      <div className="immersive-caption">{med.caption}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Verification Details Box */}
              {activeStory.reviewerComments && (
                <div className="immersive-verification-box">
                  <h4 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                    🛡️ Fact-Checking & Verification Log
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>
                    This citizen submission was formally audited and verified based on regional data alignment, cross-referencing, and geolocation verification guidelines.
                  </p>
                  <blockquote style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '1rem', fontStyle: 'italic', margin: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    &ldquo;{activeStory.reviewerComments}&rdquo;
                  </blockquote>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.5rem', fontWeight: 600 }}>
                    Verified by: {activeStory.verifiedBy} &bull; Timestamp: {formatStoryDate(activeStory.verifiedAt)}
                  </div>
                </div>
              )}

              {/* Source References */}
              {activeStory.sourceReferences && activeStory.sourceReferences.length > 0 && (
                <div className="immersive-references-list">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                    📖 Provided Source References
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    The citizen reporter cited the following physical, digital, or eyewitness records as supporting evidence:
                  </p>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#ffffff' }}>
                    {activeStory.sourceReferences.map((ref, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Misinformation Reporting Area */}
              <div style={{ background: 'rgba(229, 62, 98, 0.04)', border: '1px dashed var(--accent-red)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem' }}>
                <div className="flex-between">
                  <div>
                    <h4 style={{ color: 'var(--accent-red)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚠️ Dispute This Report?
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      If you have verifiable context proving this story contains misinformation, report it instantly.
                    </p>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowFlagForm(!showFlagForm)}
                    style={{ border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {showFlagForm ? 'Cancel' : 'Report Fake News'}
                  </button>
                </div>

                {flagSubmitted && (
                  <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginTop: '1rem', fontWeight: 600 }}>
                    ✅ Report filed successfully! A Moderator will audit your source details immediately. Thank you for protecting facts.
                  </div>
                )}

                {showFlagForm && (
                  <form onSubmit={handleReportMisinformation} style={{ marginTop: '1rem', animation: 'fadeIn 0.2s' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Verifiable Objection details (Provide links or official facts):</label>
                      <textarea 
                        className="form-textarea"
                        placeholder="Explain exactly why this news is incorrect, and cite official press warnings or records..."
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        style={{ minHeight: '80px', fontSize: '0.85rem' }}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                      Submit Objection Report
                    </button>
                  </form>
                )}
              </div>

              {/* Comments Section */}
              <div className="comment-list-section">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  💬 Public Discussion ({activeStory.comments ? activeStory.comments.length : 0})
                </h3>

                {currentUser ? (
                  <form onSubmit={handleAddComment} className="comment-input-block">
                    <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Add a verified insight, question, or update..." 
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }}>
                        Post
                      </button>
                    </div>
                  </form>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Please select a persona in the top nav to join the discussion.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeStory.comments && activeStory.comments.length > 0 ? (
                    activeStory.comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <img src={comment.userAvatar} alt={comment.userName} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--glass-border)' }} />
                        <div className="comment-item-body">
                          <div className="comment-item-header">
                            <strong style={{ fontSize: '0.85rem' }}>{comment.userName}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>{formatStoryDate(comment.date)}</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-dark)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                      No comments posted yet. Start the conversation!
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
