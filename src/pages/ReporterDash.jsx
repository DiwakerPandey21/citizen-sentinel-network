import { useState, useEffect } from 'react';
import { getStories, saveStories, getCurrentUser, getUsers, saveUsers } from '../db/initialData';

export default function ReporterDash({ onNavigation, onSelectStory }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [myStories, setMyStories] = useState([]);
  
  // Dynamic Reputation States
  const [displayedRep, setDisplayedRep] = useState(0);
  const [repPopup, setRepPopup] = useState({ show: false, amount: 0, type: 'gain' });

  // Resubmission Editor State
  const [editingStory, setEditingStory] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const loadDashboardData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const allStories = getStories();
      const filtered = allStories.filter(s => s.reporterId === user.id);
      setMyStories(filtered);
    }
  };

  useEffect(() => {
    // Schedule asynchronous loading to prevent synchronous cascading renders inside the effect body
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    
    window.addEventListener('citizen_db_update', loadDashboardData);
    window.addEventListener('citizen_user_update', loadDashboardData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('citizen_db_update', loadDashboardData);
      window.removeEventListener('citizen_user_update', loadDashboardData);
    };
  }, []);

  // Smooth Reputation Counting Ticker Animation
  useEffect(() => {
    if (currentUser) {
      if (displayedRep === 0) {
        const timer = setTimeout(() => {
          setDisplayedRep(currentUser.reputation);
        }, 0);
        return () => clearTimeout(timer);
      } else if (displayedRep !== currentUser.reputation) {
        const timer = setTimeout(() => {
          const diff = currentUser.reputation - displayedRep;
          const step = diff > 0 ? 1 : -1;
          setDisplayedRep(prev => prev + step);
        }, 20);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, displayedRep]);

  const getStats = () => {
    const total = myStories.length;
    const verified = myStories.filter(s => s.status === 'approved').length;
    const pending = myStories.filter(s => s.status === 'pending').length;
    const needsEdits = myStories.filter(s => s.status === 'needs_edits').length;
    const drafted = myStories.filter(s => s.status === 'draft').length;
    return { total, verified, pending, needsEdits, drafted };
  };

  const getTierDetails = (rep) => {
    if (rep <= 50) {
      return {
        name: "Novice Reporter",
        badge: "🌱 Novice",
        color: "var(--text-muted)",
        nextTier: "Citizen Scribe",
        nextTierThreshold: 51,
        minVal: 0,
        maxVal: 50,
        progress: Math.min(100, Math.round((rep / 50) * 100)),
        glow: "0 0 10px rgba(156, 163, 175, 0.2)"
      };
    } else if (rep <= 150) {
      return {
        name: "Citizen Scribe",
        badge: "✍️ Citizen Scribe",
        color: "var(--accent-blue)",
        nextTier: "Truth Sentinel",
        nextTierThreshold: 151,
        minVal: 51,
        maxVal: 150,
        progress: Math.min(100, Math.round(((rep - 50) / 100) * 100)),
        glow: "0 0 15px rgba(99, 179, 237, 0.4)"
      };
    } else {
      return {
        name: "Truth Sentinel",
        badge: "🛡️ Truth Sentinel",
        color: "var(--accent-green)",
        nextTier: "Max Level 👑",
        nextTierThreshold: 999,
        minVal: 151,
        maxVal: 200,
        progress: 100,
        glow: "0 0 20px rgba(56, 161, 105, 0.5), 0 0 40px rgba(56, 161, 105, 0.2)"
      };
    }
  };

  const simulateRepChange = (amount) => {
    if (!currentUser) return;
    const allUsers = getUsers();
    const targetUser = Object.values(allUsers).find(u => u.id === currentUser.id);
    if (targetUser) {
      const newRep = Math.max(0, targetUser.reputation + amount);
      targetUser.reputation = newRep;
      allUsers[targetUser.username] = targetUser;
      
      // Update global user registries
      saveUsers(allUsers);
      
      // Trigger temporary popup animation
      setRepPopup({
        show: true,
        amount: amount,
        type: amount > 0 ? 'gain' : 'loss'
      });
      setTimeout(() => setRepPopup({ show: false, amount: 0, type: 'gain' }), 2500);
    }
  };

  const handleEditClick = (story) => {
    setEditingStory(story);
    setEditTitle(story.title);
    setEditDesc(story.description);
    setEditLocation(story.location);
  };

  const handleResubmit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDesc.trim() || !editLocation.trim()) return;

    const allStories = getStories();
    const updated = allStories.map(s => {
      if (s.id === editingStory.id) {
        return {
          ...s,
          title: editTitle.trim(),
          description: editDesc.trim(),
          location: editLocation.trim(),
          status: 'pending', // reset status to pending for moderation
          reviewerComments: '', // clear old reviewer request comments
          date: new Date().toISOString() // update timestamp
        };
      }
      return s;
    });

    saveStories(updated);
    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setEditingStory(null);
    }, 1500);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Verified & Published';
      case 'pending': return 'In Verification Queue';
      case 'needs_edits': return 'Revisions Required';
      case 'rejected': return 'Flagged & Rejected';
      case 'draft': return 'Saved Draft';
      default: return status;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
  };

  const stats = getStats();
  const tier = getTierDetails(displayedRep);

  if (!currentUser || currentUser.role !== 'reporter') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '600px', margin: '2rem auto' }}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 style={{ marginTop: '1rem', color: 'var(--accent-red)' }}>Reporter Access Only</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Your active profile is set to a <strong>{currentUser ? currentUser.role : 'Guest'}</strong>. Switch to a Citizen Reporter to view dashboard metrics.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onNavigation('auth')}>
          Go to Auth Gate
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Upper header summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Reporter Workspace: {currentUser.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track submission approvals, improve your reputation score, and manage drafts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigation('submit')}>
          ➕ Submit New Report
        </button>
      </div>

      {/* Analytics Counter Panels */}
      <div className="dash-stat-row">
        <div className="glass-card interactive-hover-blue">
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>CUMULATIVE SUBMISSIONS</span>
            <span className="stat-icon text-accent-blue">📝</span>
          </div>
          <div className="stat-value text-accent-blue">{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>All drafts and verified reviews</div>
        </div>

        <div className="glass-card interactive-hover-green">
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>VERIFIED ARTICLES</span>
            <span className="stat-icon text-accent-green">🛡️</span>
          </div>
          <div className="stat-value text-accent-green">{stats.verified}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Published to public reader feed</div>
        </div>

        <div className="glass-card interactive-hover-amber">
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>REVISION QUEUE</span>
            <span className="stat-icon text-accent-amber">🚧</span>
          </div>
          <div className="stat-value text-accent-amber">{stats.needsEdits}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Stories requiring factual clarification</div>
        </div>

        <div className="glass-card" style={{ borderLeft: `3px solid ${tier.color}`, boxShadow: tier.glow, position: 'relative', overflow: 'hidden' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>CONTRIBUTOR BADGE</span>
            <span className="stat-icon" style={{ filter: `drop-shadow(${tier.glow})` }}>{tier.badge.split(' ')[0]}</span>
          </div>
          <div className="stat-value" style={{ 
            fontSize: '1.6rem', 
            fontWeight: 800, 
            marginTop: '0.5rem',
            background: `linear-gradient(135deg, #ffffff 0%, ${tier.color} 100%)`, 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap'
          }}>
            {tier.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>🌟 Score: <strong>{displayedRep}</strong></span>
            <span>&bull;</span>
            <span>Level {displayedRep <= 50 ? '1' : displayedRep <= 150 ? '2' : '3'}</span>
          </div>

          {/* Floating Rep Change Popup Animation */}
          {repPopup.show && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: repPopup.type === 'gain' ? 'var(--accent-green)' : 'var(--accent-red)',
              animation: 'slideUp 0.6s ease-out forwards',
              textShadow: '0 0 10px rgba(0,0,0,0.8)'
            }}>
              {repPopup.amount > 0 ? `+${repPopup.amount}` : repPopup.amount} Rep
            </div>
          )}
        </div>
      </div>

      {/* Contributor Reputation & Badging Hub Section */}
      <div className="glass-card" style={{ 
        marginBottom: '2.5rem', 
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-md)',
        background: 'rgba(22, 28, 38, 0.45)'
      }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👑 Contributor Reputation & Achievement Hub
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Progress and Simulator Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Level Progress Gauge */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>LEVEL PROGRESS</span>
                <span style={{ fontSize: '0.85rem', color: tier.color, fontWeight: 700 }}>{displayedRep} / {tier.maxVal} Rep</span>
              </div>
              
              <div style={{ background: 'var(--bg-primary)', height: '10px', borderRadius: '5px', overflow: 'hidden', position: 'relative', marginBottom: '0.5rem' }}>
                <div style={{ 
                  width: `${tier.progress}%`, 
                  height: '100%', 
                  background: `linear-gradient(90deg, var(--accent-blue) 0%, ${tier.color} 100%)`, 
                  boxShadow: tier.glow,
                  borderRadius: '5px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>

              <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                <span>Threshold: {tier.minVal} Rep</span>
                <span>{tier.progress}% Complete</span>
                <span>Threshold: {tier.maxVal} Rep</span>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🎯</span>
                <span>
                  {displayedRep >= 151 ? (
                    <strong style={{ color: 'var(--accent-green)' }}>Max Badge Reached! You are a legendary guardian of community facts.</strong>
                  ) : (
                    <>Next Tier: <strong style={{ color: tier.color }}>{tier.nextTier}</strong> (unlocked at {tier.nextTierThreshold} reputation)</>
                  )}
                </span>
              </div>
            </div>

            {/* Demoware Reputation Adjustment Simulator */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--accent-blue)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⚙️ DEMOWARE SENTINEL SIMULATOR
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Simulate verifier reviews to instantly watch reputation count animations and badge upgrades.
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn" 
                  onClick={() => simulateRepChange(15)}
                  style={{
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.75rem', 
                    background: 'rgba(56, 161, 105, 0.1)', 
                    border: '1px solid var(--accent-green)', 
                    color: 'var(--accent-green)'
                  }}
                >
                  🟢 +15 Rep (Approve)
                </button>
                <button 
                  className="btn" 
                  onClick={() => simulateRepChange(-10)}
                  style={{
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.75rem', 
                    background: 'rgba(229, 62, 98, 0.1)', 
                    border: '1px solid var(--accent-red)', 
                    color: 'var(--accent-red)'
                  }}
                >
                  🔴 -10 Rep (Reject)
                </button>
                <button 
                  className="btn" 
                  onClick={() => simulateRepChange(2)}
                  style={{
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.75rem', 
                    background: 'rgba(99, 179, 237, 0.1)', 
                    border: '1px solid var(--accent-blue)', 
                    color: 'var(--accent-blue)'
                  }}
                >
                  🔵 +2 Rep (Needs Edits)
                </button>
              </div>
            </div>
          </div>

          {/* Achievements Chest Column */}
          <div>
            <h3 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '1rem', letterSpacing: '0.04em', fontWeight: 600 }}>
              🏆 EARNED JOURNALISM CRESTS & MILESTONES
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              
              {/* Badge 1: First Scoop */}
              {(() => {
                const unlocked = stats.total >= 1;
                return (
                  <div style={{
                    background: unlocked ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${unlocked ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    opacity: unlocked ? 1 : 0.45,
                    boxShadow: unlocked ? '0 0 10px rgba(99, 179, 237, 0.1)' : 'none',
                    transition: 'var(--transition-snappy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>📝</span>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: unlocked ? 'rgba(99, 179, 237, 0.15)' : 'none', color: unlocked ? 'var(--accent-blue)' : 'var(--text-dark)', fontWeight: 'bold' }}>
                        {unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.85rem', margin: '0.35rem 0 0.15rem 0', color: '#ffffff' }}>First Scoop</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Successfully submitted your first news report draft.</p>
                  </div>
                );
              })()}

              {/* Badge 2: Veracity Shield */}
              {(() => {
                const unlocked = stats.verified >= 1;
                return (
                  <div style={{
                    background: unlocked ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${unlocked ? 'var(--accent-green)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    opacity: unlocked ? 1 : 0.45,
                    boxShadow: unlocked ? '0 0 10px rgba(56, 161, 105, 0.1)' : 'none',
                    transition: 'var(--transition-snappy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: unlocked ? 'rgba(56, 161, 105, 0.15)' : 'none', color: unlocked ? 'var(--accent-green)' : 'var(--text-dark)', fontWeight: 'bold' }}>
                        {unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.85rem', margin: '0.35rem 0 0.15rem 0', color: '#ffffff' }}>Veracity Shield</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Earned your first officially verified publication status.</p>
                  </div>
                );
              })()}

              {/* Badge 3: Perfect Record */}
              {(() => {
                const unlocked = stats.verified >= 3 && myStories.filter(s => s.status === 'rejected').length === 0;
                return (
                  <div style={{
                    background: unlocked ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${unlocked ? 'var(--accent-amber)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    opacity: unlocked ? 1 : 0.45,
                    boxShadow: unlocked ? '0 0 10px rgba(214, 158, 46, 0.1)' : 'none',
                    transition: 'var(--transition-snappy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>✍️</span>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: unlocked ? 'rgba(214, 158, 46, 0.15)' : 'none', color: unlocked ? 'var(--accent-amber)' : 'var(--text-dark)', fontWeight: 'bold' }}>
                        {unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.85rem', margin: '0.35rem 0 0.15rem 0', color: '#ffffff' }}>Unrivaled Scribe</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Published 3+ verified reports with zero false-news rejections.</p>
                  </div>
                );
              })()}

              {/* Badge 4: Truth Sentinel */}
              {(() => {
                const unlocked = displayedRep >= 151;
                return (
                  <div style={{
                    background: unlocked ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${unlocked ? 'var(--accent-green)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    opacity: unlocked ? 1 : 0.45,
                    boxShadow: unlocked ? '0 0 15px rgba(56, 161, 105, 0.2)' : 'none',
                    transition: 'var(--transition-snappy)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>👑</span>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: unlocked ? 'rgba(56, 161, 105, 0.15)' : 'none', color: unlocked ? 'var(--accent-green)' : 'var(--text-dark)', fontWeight: 'bold' }}>
                        {unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.85rem', margin: '0.35rem 0 0.15rem 0', color: '#ffffff' }}>Sentinel Crest</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Attained peak reputation rank (151+ Rep) through truth advocacy.</p>
                  </div>
                );
              })()}

            </div>
          </div>

        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: editingStory ? '1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Submissions List */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
            📋 Your Stories & Live Status Timeline
          </h2>

          {myStories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>📭</span>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>You have not submitted any stories yet.</p>
              <button className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }} onClick={() => onNavigation('submit')}>
                Create First Report
              </button>
            </div>
          ) : (
            <div className="timeline-outer">
              {myStories.map((story) => (
                <div key={story.id} className="timeline-item">
                  <div className={`timeline-dot ${story.status}`}></div>
                  
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className={`status-tag ${story.status}`}>
                        {getStatusLabel(story.status)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                        Modified: {formatTime(story.date)}
                      </span>
                    </div>

                    <h3 
                      style={{ fontSize: '1.1rem', cursor: story.status === 'approved' ? 'pointer' : 'default', hover: { textDecoration: 'underline' } }}
                      onClick={() => {
                        if (story.status === 'approved') {
                          onSelectStory(story.id);
                          onNavigation('news');
                        }
                      }}
                    >
                      {story.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {story.description}
                    </p>

                    {/* Show moderator comments if requested edits or rejected */}
                    {story.reviewerComments && (
                      <div style={{ background: story.status === 'needs_edits' ? 'rgba(49, 130, 206, 0.05)' : 'rgba(229, 62, 98, 0.05)', borderLeft: `3px solid ${story.status === 'needs_edits' ? 'var(--accent-blue)' : 'var(--accent-red)'}`, padding: '0.75rem 1rem', borderRadius: '4px', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <strong>✍️ Moderator Review Feedback:</strong>
                        <p style={{ fontStyle: 'italic', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                          &ldquo;{story.reviewerComments}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Action buttons based on status */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '0.75rem' }}>
                      {story.status === 'needs_edits' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleEditClick(story)}
                        >
                          ✏️ Revise & Resubmit
                        </button>
                      )}
                      {story.status === 'draft' && (
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            const allStories = getStories();
                            const updated = allStories.map(s => {
                              if (s.id === story.id) return { ...s, status: 'pending', date: new Date().toISOString() };
                              return s;
                            });
                            saveStories(updated);
                          }}
                        >
                          🚀 Submit Story
                        </button>
                      )}
                      {story.status === 'approved' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            onSelectStory(story.id);
                            onNavigation('news');
                          }}
                        >
                          📖 View on Feed
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INLINE REVISION EDITOR */}
        {editingStory && (
          <div className="glass-card" style={{ border: '1px solid var(--accent-blue)', animation: 'slideUp 0.3s ease-out', position: 'sticky', top: '90px' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✏️ Resubmit Factual Revisions
              </h2>
              <button 
                onClick={() => setEditingStory(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            {editSuccess && (
              <div style={{ color: 'var(--accent-green)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                ✅ Revisions saved and story sent back to moderation successfully! Timeline updated.
              </div>
            )}

            <form onSubmit={handleResubmit}>
              <div className="form-group">
                <label className="form-label">Headline / Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Geographic Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Revised Description Narrative</label>
                <textarea 
                  className="form-textarea" 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ minHeight: '140px' }}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingStory(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Submit Clarified Story
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}
