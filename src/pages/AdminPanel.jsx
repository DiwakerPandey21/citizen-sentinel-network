import { useState, useEffect } from 'react';
import { getStories, saveStories, getUsers, saveUsers, getCurrentUser } from '../db/initialData';

export default function AdminPanel({ onNavigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [usersList, setUsersList] = useState({});
  const [adminActionLog, setAdminActionLog] = useState('');

  const loadAdminData = () => {
    setCurrentUser(getCurrentUser());
    setStories(getStories());
    setUsersList(getUsers());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdminData();
    }, 0);
    window.addEventListener('citizen_db_update', loadAdminData);
    window.addEventListener('citizen_user_update', loadAdminData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('citizen_db_update', loadAdminData);
      window.removeEventListener('citizen_user_update', loadAdminData);
    };
  }, []);

  const getKPIs = () => {
    const totalStories = stories.length;
    const verified = stories.filter(s => s.status === 'approved').length;
    const pending = stories.filter(s => s.status === 'pending').length;
    const rejected = stories.filter(s => s.status === 'rejected').length;
    
    const accuracyRate = totalStories > 0 ? Math.round(((verified) / (verified + rejected || 1)) * 100) : 100;
    
    // Count reported flags
    const flaggedStories = stories.filter(s => s.flags && s.flags.length > 0);
    const activeContributors = Object.values(usersList).filter(u => u.role === 'reporter').length;

    return { totalStories, verified, pending, rejected, accuracyRate, flaggedStories, activeContributors };
  };

  const handleDismissFlags = (storyId) => {
    const updated = stories.map(s => {
      if (s.id === storyId) {
        return { ...s, flags: [] }; // Clear reader flags
      }
      return s;
    });
    saveStories(updated);
    setAdminActionLog('Reader dispute flags dismissed. Story remains verified.');
    setTimeout(() => setAdminActionLog(''), 3000);
  };

  const handleTakedownStory = (storyId, reporterName) => {
    const updated = stories.map(s => {
      if (s.id === storyId) {
        return { 
          ...s, 
          status: 'rejected', 
          flags: [], 
          reviewerComments: 'Takedown triggered by administrator following reader disputes confirming dangerous misinformation.' 
        };
      }
      return s;
    });

    // Penalize reporter reputation heavily for fake news takedown
    const allUsers = getUsers();
    const targetReporter = Object.values(allUsers).find(u => u.name === reporterName);
    if (targetReporter) {
      targetReporter.reputation = Math.max(0, targetReporter.reputation - 25);
      allUsers[targetReporter.username] = targetReporter;
      saveUsers(allUsers);
    }

    saveStories(updated);
    setAdminActionLog(`Content taken down. Penalty applied to @${reporterName}'s Reputation Score (-25).`);
    setTimeout(() => setAdminActionLog(''), 3500);
  };

  const handleAdjustReputation = (username, amount) => {
    const allUsers = getUsers();
    if (allUsers[username]) {
      allUsers[username].reputation = Math.max(0, allUsers[username].reputation + amount);
      saveUsers(allUsers);
      setAdminActionLog(`Reputation score for @${username} adjusted by ${amount > 0 ? '+' : ''}${amount}.`);
      setTimeout(() => setAdminActionLog(''), 3000);
    }
  };

  const kpis = getKPIs();

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '600px', margin: '2rem auto' }}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 style={{ marginTop: '1rem', color: 'var(--accent-red)' }}>Administrator Access Required</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Your active profile is set to a <strong>{currentUser ? currentUser.role : 'Guest'}</strong>. Only system Administrators can access the master metrics and moderation logs.
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
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Master System Analytics & Administration</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor regional system accuracy KPIs, inspect citizen dispute flags, and manage user clearance profiles.</p>
      </div>

      {adminActionLog && (
        <div style={{ background: 'rgba(229,62,98,0.1)', border: '1px solid var(--accent-red)', padding: '1rem', borderRadius: '8px', color: '#ffffff', fontSize: '0.9rem', marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
          <span>🛡️ <strong>System Admin Action:</strong> {adminActionLog}</span>
        </div>
      )}

      {/* Admin KPI stats */}
      <div className="admin-metrics-grid" style={{ marginBottom: '3rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>VERIFICATION ACCURACY</span>
          <div className="stat-value text-accent-green" style={{ fontSize: '2rem' }}>{kpis.accuracyRate}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>Ratio of approved vs rejected reports</div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE CONTRIBUTORS</span>
          <div className="stat-value text-accent-blue" style={{ fontSize: '2rem' }}>{kpis.activeContributors}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>Registered citizen reporting keys</div>
        </div>

        <div className="glass-card" style={{ borderColor: kpis.flaggedStories.length > 0 ? 'var(--accent-red)' : '' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE READER DISPUTES</span>
          <div className="stat-value text-accent-red" style={{ fontSize: '2rem' }}>{kpis.flaggedStories.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>Stories flagged as misinformation</div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>VERIFICATION BACKLOG</span>
          <div className="stat-value text-accent-amber" style={{ fontSize: '2rem' }}>{kpis.pending}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>Stories awaiting fact-checker audit</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Flagged Content Moderation Queue */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)' }}>
            🚨 Reader Misinformation & Dispute Center
          </h2>

          {kpis.flaggedStories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem' }}>🛡️</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>No disputes reported. The citizen news feed is verified and clean!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {kpis.flaggedStories.map((story) => (
                <div key={story.id} style={{ background: 'rgba(229, 62, 98, 0.03)', border: '1px solid rgba(229, 62, 98, 0.15)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span className="status-tag approved">Verified News</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>By: {story.reporterName}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff' }}>{story.title}</h3>
                  
                  {/* Flag Comments Box */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '4px', margin: '0.75rem 0', borderLeft: '3px solid var(--accent-red)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>⚠️ Reader Dispute Clarification:</span>
                    {story.flags.map((flag, idx) => (
                      <div key={flag.id || idx} style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#e5e7eb' }}>
                        &ldquo;{flag.reason}&rdquo; 
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.15rem' }}>
                          Reported by: {flag.userName} &bull; Timestamp: {new Date(flag.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleDismissFlags(story.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--accent-green)', color: 'var(--accent-green)' }}
                    >
                      Dismiss Flags
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleTakedownStory(story.id, story.reporterName)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      💥 Take Down & Penalize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Reputation & Directory */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
            👥 Citizen Network Directory
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
            {Object.values(usersList).map((usr, idx) => (
              <div 
                key={`${usr.id}_${usr.username}_${idx}`} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div className="flex-align" style={{ gap: '0.75rem' }}>
                  <img src={usr.avatar} alt={usr.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>{usr.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      @{usr.username} &bull; <span style={{ textTransform: 'capitalize' }}>{usr.role}</span>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Reputation: <strong style={{ color: usr.role === 'admin' ? 'var(--accent-red)' : usr.role === 'verifier' ? 'var(--accent-amber)' : usr.role === 'reporter' ? 'var(--accent-blue)' : 'var(--accent-green)' }}>{usr.reputation}</strong>
                  </span>
                  
                  {usr.role === 'reporter' && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => handleAdjustReputation(usr.username, 10)}
                        style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--accent-green)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        +10
                      </button>
                      <button 
                        onClick={() => handleAdjustReputation(usr.username, -10)}
                        style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--accent-red)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        -10
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
