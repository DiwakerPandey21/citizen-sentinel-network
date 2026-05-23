import { useState, useEffect } from 'react';
import { getStories, saveStories, getUsers, saveUsers, getCurrentUser, CATEGORIES } from '../db/initialData';

export default function VerifyPanel({ onNavigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingStories, setPendingStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  
  // Verification Checklist State
  const [chkGeo, setChkGeo] = useState(false);
  const [chkSources, setChkSources] = useState(false);
  const [chkMedia, setChkMedia] = useState(false);
  const [chkObjective, setChkObjective] = useState(false);

  // Review Feedback Fields
  const [reviewComments, setReviewComments] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  // AI Fact Check and Google API simulation state variables
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [googleQuery, setGoogleQuery] = useState('');
  const [isQueryingGoogle, setIsQueryingGoogle] = useState(false);
  const [googleResults, setGoogleResults] = useState(null);

  const getAiReport = (story) => {
    if (!story) return null;
    if (story.aiReport) return story.aiReport;
    
    const sensationalWords = ['shocking', 'unbelievable', 'exposed', 'scam', 'conspiracy', 'magic', 'alien', 'secret', 'horrific', 'disaster', 'corrupt', 'must watch', 'hackers', 'furious', 'scandal', 'mind-blowing'];
    const lowercaseTitle = story.title.toLowerCase();
    const flaggedTitleWords = sensationalWords.filter(word => lowercaseTitle.includes(word));
    const hasTitleExclamation = story.title.includes('!');
    
    const titleWords = story.title.split(/\s+/);
    const allCapsWords = titleWords.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));

    const emotionalWords = ['horrific', 'disaster', 'terrible', 'disgrace', 'evil', 'idiots', 'liars', 'scumbags', 'ruining', 'hate', 'stupid', 'garbage', 'furious', 'criminals'];
    const lowercaseDesc = story.description.toLowerCase();
    const flaggedDescWords = emotionalWords.filter(word => lowercaseDesc.includes(word));

    const hasNumbers = /\d+/.test(story.description) || /\d+/.test(story.location);
    
    let score = 75; // Default for seed data
    let deductions = [];
    let bonuses = [];

    if (flaggedTitleWords.length > 0) {
      score -= 15;
      deductions.push(`Sensational headline language: "${flaggedTitleWords.join(', ')}"`);
    }
    if (hasTitleExclamation) {
      score -= 10;
      deductions.push("Headline contains exclamation marks");
    }
    if (allCapsWords.length > 0) {
      score -= 15;
      deductions.push(`ALL CAPS words: "${allCapsWords.join(', ')}"`);
    }
    if (flaggedDescWords.length > 0) {
      score -= 15;
      deductions.push(`Subjective/emotional language: "${flaggedDescWords.join(', ')}"`);
    }
    if (story.description.length > 150) {
      score += 10;
      bonuses.push("Detailed narrative text (>150 characters)");
    }
    if (hasNumbers) {
      score += 10;
      bonuses.push("Spatiotemporal cues (numbers/dates/addresses) present");
    }
    if (story.sourceReferences && story.sourceReferences.length > 0 && !story.sourceReferences[0].includes('eyewitness')) {
      score += 15;
      bonuses.push("Objective citation references verified");
    } else {
      score -= 10;
      deductions.push("Lacks official citation sources");
    }

    score = Math.max(0, Math.min(score, 100));

    return {
      score,
      deductions,
      bonuses,
      flaggedTitleWords,
      flaggedDescWords,
      isSensational: flaggedTitleWords.length > 0 || hasTitleExclamation || allCapsWords.length > 0
    };
  };

  const handleQueryGoogleApi = () => {
    if (!googleQuery.trim()) return;
    setIsQueryingGoogle(true);
    setGoogleResults(null);
    setTimeout(() => {
      const q = googleQuery.toLowerCase();
      let matches = [];

      if (q.includes('telescope') || q.includes('nasa') || q.includes('webb') || q.includes('exoplanet') || q.includes('atmosphere')) {
        matches.push({
          claim: "NASA James Webb Space Telescope confirms water vapor and atmosphere signatures on super-Earth exoplanet",
          claimant: "NASA Science Mission Press Release",
          factCheckOrganization: "Poynter IFCN Science Registry",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "True",
          explanation: "Peer-reviewed astrophysical data matches spectral signature profiles of water molecules in M-dwarf stellar orbits. NASA, ESA, and international research laboratories have cross-verified the planetary modeling.",
          url: "https://www.poynter.org/ifcn/"
        });
      } else if (q.includes('subsidy') || q.includes('phishing') || q.includes('ministry') || q.includes('finance') || q.includes('whatsapp') || q.includes('viral') || q.includes('pib')) {
        matches.push({
          claim: "Ministry of Finance is distributing direct cash subsidies to all citizens via bank links",
          claimant: "Viral WhatsApp Forward Message",
          factCheckOrganization: "PIB Fact Check Unit",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "False / Phishing Scam",
          explanation: "Official circular from India's Press Information Bureau (PIB) confirms that the Ministry of Finance has authorized no such distribution program. The link cited in the message is a fraudulent phishing portal attempting to harvest citizen banking credentials.",
          url: "https://www.pib.gov.in/indexd.aspx?reg=3&lang=1"
        });
      } else if (q.includes('unesco') || q.includes('digital') || q.includes('literacy') || q.includes('classroom') || q.includes('social')) {
        matches.push({
          claim: "UNESCO launches international media framework for digital literacy in high schools",
          claimant: "UNESCO Paris Secretariat Statement",
          factCheckOrganization: "UNESCO Media Literacy Directorate",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "True / Official Guideline",
          explanation: "UNESCO officially deployed its global competence standards instructing educators on teaching high school pupils how to analyze digital footprints, detect automated algorithmic bias, and identify deepfakes.",
          url: "https://www.unesco.org/en/media-information-literacy"
        });
      } else if (q.includes('poynter') || q.includes('ifcn') || q.includes('investigative') || q.includes('grant') || q.includes('hyperlocal')) {
        matches.push({
          claim: "Poynter IFCN grants emergency funding and satellite tools to small citizen newsrooms",
          claimant: "IFCN Secretariat Bulletin",
          factCheckOrganization: "Poynter IFCN Registry",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "True",
          explanation: "The International Fact-Checking Network confirmed disbursement of hyperlocal grants providing citizen teams with remote sensing tools, drone mapping tech, and verification forensics training.",
          url: "https://www.poynter.org/ifcn/"
        });
      } else if (q.includes('cryptographic') || q.includes('encryption') || q.includes('sensor') || q.includes('deepfake') || q.includes('decentralized')) {
        matches.push({
          claim: "Mobile camera hardware cryptography can authenticate photo geolocation integrity",
          claimant: "Privacy and Security Engineering Summit",
          factCheckOrganization: "MIT Technology Review / IFCN Technical Audit",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "True",
          explanation: "Cryptographic signature protocols embedded directly inside mobile camera sensors produce verifiable geolocation and timing keys, providing mathematically sound prevention of post-capture deepfakes.",
          url: "https://www.poynter.org/ifcn/"
        });
      } else if (q.includes('crack') || q.includes('bridge') || q.includes('highway') || q.includes('structural')) {
        matches.push({
          claim: "Highway bridge has a severe structural crack ready to collapse",
          claimant: "Social Media Posts / WhatsApp forwards",
          factCheckOrganization: "Snopes Fact Check",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "Mixture / Needs Context",
          explanation: "Municipal engineers confirmed a thermal expansion joint seal had weathered, creating a visual gap. No structural compromise or immediate danger was found after official core testing. Authority scheduled cosmetic repairs.",
          url: "https://www.snopes.com/fact-check/bridge-structural-collapse-warning/"
        });
        matches.push({
          claim: "Outer Ring Road flyover closed due to bridge failure",
          claimant: "Local Viral Feeds",
          factCheckOrganization: "PIB Fact Check",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "False",
          explanation: "PIB checked the notice. Standard preventative maintenance is scheduled, but the flyover remains open and structurally safe.",
          url: "https://www.pib.gov.in/indexd.aspx?reg=3&lang=1"
        });
      } else if (q.includes('water') || q.includes('pollution') || q.includes('chemical') || q.includes('runoff') || q.includes('discharge')) {
        matches.push({
          claim: "Industrial chemical runoff has contaminated the local municipal reservoir",
          claimant: "Environmental activist groups",
          factCheckOrganization: "PolitiFact",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "Mostly True",
          explanation: "State ecology department confirmed high ammonia run-off in the peripheral canal. However, water filtration plants successfully isolated the inflow. Drinking water supplies remain within legal safety thresholds.",
          url: "https://www.politifact.com/factchecks/reservoir-pollution-claims/"
        });
      } else if (q.includes('vaccine') || q.includes('clinic') || q.includes('queue') || q.includes('shortage')) {
        matches.push({
          claim: "Primary health clinics completely out of stock of vaccines due to supply collapse",
          claimant: "Citizen reports",
          factCheckOrganization: "FactCheck.org",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "Misleading",
          explanation: "Distribution delays did occur on Monday morning at 2 wards, but emergency stocks were dispatched by midday. Clinics were never completely depleted of basic pediatric supply.",
          url: "https://www.factcheck.org/clinic-vaccine-depletion-debunk/"
        });
      } else {
        matches.push({
          claim: `Recent reports claiming immediate danger regarding "${googleQuery}"`,
          claimant: "Regional forums and chat groups",
          factCheckOrganization: "Snopes Fact Check",
          reviewDate: new Date().toLocaleDateString(),
          textualRating: "No Direct Debunk Found",
          explanation: `No exact identical verified claim was matched in the global Google Fact Check ClaimReview registry for "${googleQuery}". Verification officers should perform primary local source validation.`,
          url: "https://www.snopes.com"
        });
      }

      setGoogleResults(matches);
      setIsQueryingGoogle(false);
    }, 1500);
  };

  const loadPendingData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const all = getStories();
    const filtered = all.filter(s => s.status === 'pending');
    setPendingStories(filtered);
    
    // Default active story to first pending item if exists and not already set
    if (filtered.length > 0) {
      setActiveStory(filtered[0]);
    } else {
      setActiveStory(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPendingData();
    }, 0);
    window.addEventListener('citizen_db_update', loadPendingData);
    window.addEventListener('citizen_user_update', loadPendingData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('citizen_db_update', loadPendingData);
      window.removeEventListener('citizen_user_update', loadPendingData);
    };
  }, []);

  // Reset checklist on active story change
  useEffect(() => {
    const timer = setTimeout(() => {
      setChkGeo(false);
      setChkSources(false);
      setChkMedia(false);
      setChkObjective(false);
      setReviewComments('');
      setGoogleResults(null);
      if (activeStory) {
        const cleanWords = activeStory.title.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 4).slice(0, 3).join(' ');
        setGoogleQuery(cleanWords || activeStory.title);
      } else {
        setGoogleQuery('');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeStory]);

  const updateStoryStatus = (statusType) => {
    if (!activeStory || !currentUser) return;
    if (!reviewComments.trim()) {
      alert('Please provide official reviewer audit notes explaining your decision!');
      return;
    }

    const allStories = getStories();
    const allUsers = getUsers();
    
    // 1. Update story values
    const updatedStories = allStories.map(s => {
      if (s.id === activeStory.id) {
        return {
          ...s,
          status: statusType,
          reviewerComments: reviewComments.trim(),
          verifiedAt: statusType === 'approved' ? new Date().toISOString() : null,
          verifiedBy: statusType === 'approved' ? currentUser.name : null
        };
      }
      return s;
    });

    // 2. Adjust reporter reputation based on outcome
    const targetReporter = Object.values(allUsers).find(u => u.name === activeStory.reporterName);
    if (targetReporter) {
      if (statusType === 'approved') {
        targetReporter.reputation += 15; // Reward accurate report
      } else if (statusType === 'rejected') {
        targetReporter.reputation = Math.max(0, targetReporter.reputation - 10); // Penalty for false/rejected news
      } else if (statusType === 'needs_edits') {
        targetReporter.reputation += 2; // Tiny nudge for trying, encourage accuracy
      }
      allUsers[targetReporter.username] = targetReporter;
      saveUsers(allUsers);
    }

    saveStories(updatedStories);

    if (statusType === 'approved') {
      const approvedStory = updatedStories.find(s => s.id === activeStory.id);
      window.dispatchEvent(new CustomEvent('citizen_breaking_news', { detail: approvedStory }));
    }

    setStatusSuccess(`Story marked as ${statusType.toUpperCase()}! Database updated.`);
    
    setTimeout(() => {
      setStatusSuccess('');
      loadPendingData();
    }, 2000);
  };

  const getCategoryInfo = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || { name: 'News', icon: '📝', color: '#6b7280' };
  };

  if (!currentUser || (currentUser.role !== 'verifier' && currentUser.role !== 'admin')) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '600px', margin: '2rem auto' }}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 style={{ marginTop: '1rem', color: 'var(--accent-red)' }}>Verification Personnel Only</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Your active profile is set to a <strong>{currentUser ? currentUser.role : 'Guest'}</strong>. Only authorized Moderators or Fact-Checkers can access the Verification Workspace.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onNavigation('auth')}>
          Go to Auth Gate
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Moderator Fact-Checking & Verification Desk</h1>
        <p style={{ color: 'var(--text-muted)' }}>Review incoming citizen submissions, audit citation references, and cross-verify with local databases.</p>
      </div>

      {statusSuccess && (
        <div style={{ background: 'rgba(56,161,105,0.15)', border: '1px solid var(--accent-green)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '2rem' }}>
          <strong>🚀 Verification Update Success:</strong> {statusSuccess}
        </div>
      )}

      {pendingStories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: '4.5rem' }}>🍵</span>
          <h2 style={{ marginTop: '1.5rem', fontSize: '1.5rem' }}>All Caught Up!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto' }}>
            There are currently no pending submissions in the verification queue. Relax, or review published articles in the news feed.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => onNavigation('news')}>
            Browse Public News Feed
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left: Mini Submissions Queue List */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>
              📥 Pending Submissions ({pendingStories.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
              {pendingStories.map((story) => {
                const isSelected = activeStory && activeStory.id === story.id;
                return (
                  <div 
                    key={story.id}
                    onClick={() => setActiveStory(story)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'var(--accent-amber)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'var(--transition-snappy)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>📍 {story.location.split(',')[0]}</span>
                      <span>⏱ {new Date(story.date).toLocaleDateString()}</span>
                    </div>
                    <strong style={{ fontSize: '0.85rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#ffffff' }}>
                      {story.title}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>By: {story.reporterName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Splitted workspace */}
          {activeStory && (
            <div className="split-verify-pane">
              
              {/* Story Details Pane */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="status-tag pending">IN REVIEW QUEUE</span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: getCategoryInfo(activeStory.category).color }}>
                    {getCategoryInfo(activeStory.category).icon} {getCategoryInfo(activeStory.category).name}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    📍 {activeStory.location}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.5rem', lineHeight: 1.3 }}>{activeStory.title}</h2>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                  <img src={activeStory.reporterAvatar} alt={activeStory.reporterName} className="user-avatar-sm" />
                  <span style={{ fontSize: '0.85rem' }}>
                    Reporter: <strong>{activeStory.reporterName}</strong> &bull; Submitted on: {new Date(activeStory.date).toLocaleString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                  {activeStory.description}
                </p>

                {/* Evidence Image */}
                {activeStory.media && activeStory.media.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Attached Evidence Media:</h4>
                    <img src={activeStory.media[0].url} alt="Evidence" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }} />
                    <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-dark)', marginTop: '0.25rem', textAlign: 'center' }}>
                      {activeStory.media[0].caption}
                    </div>
                  </div>
                )}

                {/* Source References */}
                {activeStory.sourceReferences && activeStory.sourceReferences.length > 0 && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      📖 Reporter Citations / References
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {activeStory.sourceReferences.map((ref, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right panel: AI Assistant + Fact Check Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '90px' }}>
                
                {/* AI COPILOT CARD */}
                <div className="glass-card" style={{ border: '1px solid var(--accent-blue)', padding: '1.25rem', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowAiAssistant(!showAiAssistant)}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🤖 AI Fact-Check Assistant
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{showAiAssistant ? '▼ Hide' : '▲ Show'}</span>
                  </div>

                  {showAiAssistant && (
                    <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.3s ease-out' }}>
                      {(() => {
                        const report = getAiReport(activeStory);
                        if (!report) return null;
                        return (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simulated Integrity Confidence</span>
                              <span style={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 700, 
                                color: report.score >= 80 ? 'var(--accent-green)' : report.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'
                              }}>
                                {report.score}%
                              </span>
                            </div>
                            <div style={{ background: 'var(--bg-primary)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                              <div style={{ 
                                width: `${report.score}%`, 
                                height: '100%', 
                                background: report.score >= 80 ? 'var(--accent-green)' : report.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)',
                                borderRadius: '3px'
                              }}></div>
                            </div>

                            {/* Warnings/Findings */}
                            {report.isSensational && (
                              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(229,62,98,0.08)', border: '1px solid rgba(229,62,98,0.2)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--accent-red)' }}>
                                <span>⚠️</span>
                                <span>Clickbait markers or emotional phrasing detected. Exercise strict caution.</span>
                              </div>
                            )}

                            {/* Bullet deductions */}
                            {report.deductions.length > 0 && (
                              <div style={{ marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '0.25rem' }}>AI AUDIT FLAGS:</span>
                                <ul style={{ paddingLeft: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  {report.deductions.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                              </div>
                            )}

                            
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* 🛡️ FACT-CHECK RESEARCH STATION (PIB & IFCN) */}
                <div className="glass-card" style={{ border: '1px solid var(--accent-blue)', padding: '1.25rem', margin: 0, boxShadow: '0 0 15px rgba(49, 130, 206, 0.1)', animation: 'fadeIn 0.3s ease-out' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--accent-blue)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛡️ Fact-Check Research Station (PIB & IFCN)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Cross-reference citizen reports and live imported feeds against the global Poynter IFCN, Press Information Bureau (PIB) India, and UNESCO media registry indexes.
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search PIB/IFCN archives..." 
                      value={googleQuery}
                      onChange={(e) => setGoogleQuery(e.target.value)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleQueryGoogleApi}
                      disabled={isQueryingGoogle}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)' }}
                    >
                      {isQueryingGoogle ? '🔍 Searching...' : 'Query Registry'}
                    </button>
                  </div>

                  {isQueryingGoogle && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', animation: 'pulseGlow 1.5s infinite', marginTop: '0.5rem' }}>Searching official databases...</p>
                  )}

                  {googleResults && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)', maxHeight: '200px', overflowY: 'auto', marginTop: '0.75rem' }}>
                      {googleResults.map((res, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', borderBottom: i < googleResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: i < googleResults.length - 1 ? '0.5rem' : '0', marginBottom: i < googleResults.length - 1 ? '0.5rem' : '0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {res.factCheckOrganization.includes('PIB') ? '🇮🇳' : '🛡️'} {res.factCheckOrganization}
                            </span>
                            <span style={{ 
                              fontWeight: 800, 
                              fontSize: '0.65rem',
                              color: res.textualRating.toLowerCase().includes('false') ? 'var(--accent-red)' : res.textualRating.toLowerCase().includes('true') ? 'var(--accent-green)' : 'var(--accent-amber)',
                              background: 'var(--bg-primary)',
                              padding: '0.1rem 0.3rem',
                              borderRadius: '2px'
                            }}>
                              {res.textualRating}
                            </span>
                          </div>
                          <p style={{ color: '#ffffff', fontStyle: 'italic', marginBottom: '0.25rem' }}>"{res.claim}"</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: '1.4' }}>{res.explanation}</p>
                          
                          {/* Compliance Badges */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 161, 105, 0.1)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '0.15rem 0.35rem', borderRadius: '2px' }}>
                              ✓ IFCN Compliant Audit
                            </span>
                            {res.factCheckOrganization.includes('PIB') && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(49, 130, 206, 0.1)', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', padding: '0.15rem 0.35rem', borderRadius: '2px' }}>
                                ✓ Official PIB Advisory
                              </span>
                            )}
                          </div>

                          <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', display: 'inline-block', marginTop: '0.5rem' }}>
                            Read Official Claim Review &rarr;
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions & Fact Check checklist */}
                <div className="glass-card" style={{ border: '1px solid var(--accent-amber)', padding: '1.25rem', margin: 0 }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-amber)', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛡️ Fact-Check Audit Checklist
                  </h3>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Follow IFCN & PIB verification standards. Check each item to confirm thorough investigation:
                  </p>

                  {/* Interactive Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div className="checklist-item" onClick={() => setChkGeo(!chkGeo)} style={{ margin: 0, padding: '0.4rem' }}>
                      <input type="checkbox" checked={chkGeo} readOnly style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: chkGeo ? '#ffffff' : 'var(--text-muted)' }}>
                        <strong>Geolocation Match:</strong> Confirmed visual match using landmark coordinates and regional grid.
                      </span>
                    </div>

                    <div className="checklist-item" onClick={() => setChkSources(!chkSources)} style={{ margin: 0, padding: '0.4rem' }}>
                      <input type="checkbox" checked={chkSources} readOnly style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: chkSources ? '#ffffff' : 'var(--text-muted)' }}>
                        <strong>Source Reference Audit:</strong> Verified reference links, municipal notices, or local group reports are genuine.
                      </span>
                    </div>

                    <div className="checklist-item" onClick={() => setChkMedia(!chkMedia)} style={{ margin: 0, padding: '0.4rem' }}>
                      <input type="checkbox" checked={chkMedia} readOnly style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: chkMedia ? '#ffffff' : 'var(--text-muted)' }}>
                        <strong>Evidence Validation:</strong> Performed visual examination. Confirmed media matches date, time, and scale.
                      </span>
                    </div>

                    <div className="checklist-item" onClick={() => setChkObjective(!chkObjective)} style={{ margin: 0, padding: '0.4rem' }}>
                      <input type="checkbox" checked={chkObjective} readOnly style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.8rem', color: chkObjective ? '#ffffff' : 'var(--text-muted)' }}>
                        <strong>Objective Balance:</strong> Text avoids clickbait, hyperbole, or defamatory remarks. Facts only.
                      </span>
                    </div>
                  </div>

                  {/* Audit Comments */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Verification Audit Notes (Publicly visible log) <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                    <textarea 
                      className="form-textarea"
                      placeholder="Provide detailed fact-checking notes. e.g. Geolocation matches Ward 12. Cross-referenced with local water utility bulletins. Authentic evidence confirmed."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      style={{ minHeight: '80px', fontSize: '0.85rem' }}
                      required
                    ></textarea>
                  </div>

                  {/* Actions Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <button 
                      className="btn btn-success" 
                      onClick={() => updateStoryStatus('approved')}
                      disabled={!chkGeo || !chkSources || !chkMedia || !chkObjective}
                      style={{ opacity: (!chkGeo || !chkSources || !chkMedia || !chkObjective) ? 0.5 : 1, cursor: (!chkGeo || !chkSources || !chkMedia || !chkObjective) ? 'not-allowed' : 'pointer' }}
                    >
                      🛡️ Approve & Publish News
                    </button>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textAlign: 'center', marginTop: '-0.25rem' }}>
                      * Approve button unlocks once all 4 audit checks are checked.
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => updateStoryStatus('needs_edits')}
                        style={{ border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', fontSize: '0.8rem', padding: '0.5rem' }}
                      >
                        🚧 Needs Edits
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => updateStoryStatus('rejected')}
                        style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
