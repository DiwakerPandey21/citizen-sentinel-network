import { useState, useEffect } from 'react';
import { initializeDatabase, getCurrentUser, setCurrentUser, getStories, PERSONAS } from './db/initialData';
import NewsFeed from './pages/NewsFeed';
import MapHub from './pages/MapHub';
import MediaLiteracy from './pages/MediaLiteracy';
import StorySubmit from './pages/StorySubmit';
import ReporterDash from './pages/ReporterDash';
import VerifyPanel from './pages/VerifyPanel';
import AdminPanel from './pages/AdminPanel';
import AuthGate from './pages/AuthGate';

export default function App() {
  const [activePage, setActivePage] = useState('news');
  const [currentUser, setCurrentUserLocal] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  
  // Backlog and notifications counter
  const [pendingCount, setPendingCount] = useState(0);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);

  // PWA and Offline Sandbox States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(localStorage.getItem('citizen_simulated_offline') === 'true');
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(localStorage.getItem('citizen_pwa_installed') === 'true');
  const [isInstalling, setIsInstalling] = useState(false);

  const handleOfflineModeToggle = () => {
    const nextVal = !simulatedOffline;
    setSimulatedOffline(nextVal);
    localStorage.setItem('citizen_simulated_offline', nextVal ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('citizen_offline_change', { detail: nextVal }));
  };

  const handleSimulatedInstall = () => {
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      setIsInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('citizen_pwa_installed', 'true');
    }, 1500);
  };

  const playBreakingNewsChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq, time, dur) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.12, time + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        
        osc.start(time);
        osc.stop(time + dur);
      };
      
      const now = ctx.currentTime;
      playTone(587.33, now, 0.4); // D5
      playTone(659.25, now + 0.12, 0.4); // E5
      playTone(880.00, now + 0.24, 0.6); // A5
    } catch (e) {
      console.warn("Chime Audio context deferred:", e);
    }
  };



  // Initialize DB and state
  const syncState = () => {
    initializeDatabase();
    const user = getCurrentUser();
    setCurrentUserLocal(user);
    
    // Check pending count
    const allStories = getStories();
    const pending = allStories.filter(s => s.status === 'pending').length;
    setPendingCount(pending);
  };

  useEffect(() => {
    setTimeout(() => {
      syncState();
    }, 0);
    
    // Listen for custom state machine updates
    window.addEventListener('citizen_db_update', syncState);
    window.addEventListener('citizen_user_update', syncState);

    // Network status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-trigger PWA install banner after 8s for premium demo experience
    let installTimer = null;
    const dismissed = localStorage.getItem('citizen_pwa_dismissed') === 'true';
    const installed = localStorage.getItem('citizen_pwa_installed') === 'true';
    if (!installed && !dismissed) {
      installTimer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 8000);
    }

    // Listen for breaking news alerts
    const handleBreakingAlert = (e) => {
      const story = e.detail;
      if (story) {
        setActiveAlert(story);
        playBreakingNewsChime();
        setTimeout(() => {
          setActiveAlert(null);
        }, 6000);
      }
    };
    window.addEventListener('citizen_breaking_news', handleBreakingAlert);

    // Background simulator for other community sentinels
    const AMBIENT_ALERTS = [
      {
        id: 'ambient_1',
        title: "⚡ GRID WARNING: High-Voltage Municipal Cable Severed on High Street Pier",
        location: "High Street ward",
        category: "infrastructure"
      },
      {
        id: 'ambient_2',
        title: "🌊 ECO UPDATE: Industrial Chemical Leak Isolated Near Central Water Canal",
        location: "Municipal Reservoir Sector",
        category: "environment"
      },
      {
        id: 'ambient_3',
        title: "🏥 MEDICAL ADVISORY: Ward 5 Vaccine Deficit Resolved; Emergency Shipments Checked",
        location: "Community Clinic",
        category: "health"
      }
    ];

    let countIdx = 0;
    const alertTimer = setInterval(() => {
      // Don't issue ambient alerts if offline to respect network state!
      const activeOffline = localStorage.getItem('citizen_simulated_offline') === 'true' || !navigator.onLine;
      if (activeOffline) return;

      const alertItem = AMBIENT_ALERTS[countIdx % AMBIENT_ALERTS.length];
      countIdx++;
      window.dispatchEvent(new CustomEvent('citizen_breaking_news', {
        detail: {
          ...alertItem,
          id: `ambient_${Date.now()}`,
          date: new Date().toISOString()
        }
      }));
    }, 60000);
    
    return () => {
      window.removeEventListener('citizen_db_update', syncState);
      window.removeEventListener('citizen_user_update', syncState);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (installTimer) clearTimeout(installTimer);
      window.removeEventListener('citizen_breaking_news', handleBreakingAlert);
      clearInterval(alertTimer);
    };
  }, []);

  const handleRoleSelect = (personaKey) => {
    const selectedUser = PERSONAS[personaKey];
    if (selectedUser) {
      setCurrentUser(selectedUser);
      setShowRoleDropdown(false);
      
      // Auto redirect to suitable dashboards for immediate premium feel!
      if (selectedUser.role === 'reporter') {
        setActivePage('dashboard');
      } else if (selectedUser.role === 'verifier') {
        setActivePage('verify');
      } else if (selectedUser.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('news');
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'reporter': return 'reporter';
      case 'verifier': return 'verifier';
      case 'admin': return 'admin';
      default: return 'reader';
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'news':
        return <NewsFeed selectedStoryId={selectedStoryId} clearSelectedStoryId={() => setSelectedStoryId(null)} />;
      case 'map':
        return <MapHub onNavigation={setActivePage} onSelectStory={setSelectedStoryId} />;
      case 'literacy':
        return <MediaLiteracy />;
      case 'submit':
        return <StorySubmit onNavigation={setActivePage} />;
      case 'dashboard':
        return <ReporterDash onNavigation={setActivePage} onSelectStory={setSelectedStoryId} />;
      case 'verify':
        return <VerifyPanel onNavigation={setActivePage} />;
      case 'admin':
        return <AdminPanel onNavigation={setActivePage} />;
      case 'auth':
        return <AuthGate onAuthSuccess={() => setActivePage('news')} />;
      default:
        return <NewsFeed selectedStoryId={selectedStoryId} clearSelectedStoryId={() => setSelectedStoryId(null)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Offline Sandbox Banner */}
      {(isOffline || simulatedOffline) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(217, 119, 6, 0.95)',
          color: '#000000',
          textAlign: 'center',
          padding: '0.4rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          zIndex: 99999,
          boxShadow: '0 2px 10px rgba(217, 119, 6, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          backdropFilter: 'blur(10px)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span>💾</span>
          <span>OFFLINE SANDBOX MODE ACTIVE — Local draft caching enabled!</span>
        </div>
      )}

      {/* PWA Install Promotion Banner */}
      {showInstallBanner && !isInstalled && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          left: '20px',
          maxWidth: '480px',
          margin: '0 auto',
          background: 'rgba(15, 18, 23, 0.95)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(99, 179, 237, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backdropFilter: 'blur(15px)',
          animation: 'slideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>Install Citizen Journal App</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Add to your home screen for rapid offline reading, local draft caching, and real-time community alerts.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} 
              onClick={() => {
                setShowInstallBanner(false);
                localStorage.setItem('citizen_pwa_dismissed', 'true');
              }}
            >
              Later
            </button>
            <button 
              className="btn btn-primary" 
              style={{ 
                padding: '0.4rem 1rem', 
                fontSize: '0.75rem', 
                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #3182ce 100%)',
                boxShadow: '0 0 8px rgba(99, 179, 237, 0.4)',
                border: 'none',
                color: '#ffffff'
              }}
              onClick={handleSimulatedInstall}
              disabled={isInstalling}
            >
              {isInstalling ? 'Installing...' : 'Install Now'}
            </button>
          </div>
        </div>
      )}

      {/* Top Fixed Premium Navbar */}
      <header className="navbar-shell">
        <div className="brand-section" onClick={() => setActivePage('news')}>
          <span className="brand-logo-icon">🛡️</span>
          <span>CITIZEN JOURNAL</span>
        </div>

        {/* Global Navigation Links */}
        <nav className="nav-links">
          <div 
            className={`nav-item ${activePage === 'news' ? 'active' : ''}`}
            onClick={() => { setActivePage('news'); setSelectedStoryId(null); }}
          >
            📰 News Feed
          </div>
          
          <div 
            className={`nav-item ${activePage === 'map' ? 'active' : ''}`}
            onClick={() => setActivePage('map')}
          >
            🗺️ News Map
          </div>
          
          <div 
            className={`nav-item ${activePage === 'literacy' ? 'active' : ''}`}
            onClick={() => setActivePage('literacy')}
          >
            📖 Media Literacy
          </div>

          {/* Citizen Reporter Nav Links */}
          {currentUser && currentUser.role === 'reporter' && (
            <>
              <div 
                className={`nav-item ${activePage === 'submit' ? 'active' : ''}`}
                onClick={() => setActivePage('submit')}
              >
                ➕ Submit Report
              </div>
              <div 
                className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('dashboard')}
              >
                📊 My Dashboard
              </div>
            </>
          )}

          {/* Moderator Nav Links */}
          {currentUser && (currentUser.role === 'verifier' || currentUser.role === 'admin') && (
            <div 
              className={`nav-item ${activePage === 'verify' ? 'active' : ''}`}
              onClick={() => setActivePage('verify')}
              style={{ position: 'relative' }}
            >
              🛡️ Verification Queue
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-10px',
                  background: 'var(--accent-amber)',
                  color: '#000000',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px var(--accent-amber)',
                  animation: 'pulseGlow 2s infinite'
                }}>
                  {pendingCount}
                </span>
              )}
            </div>
          )}

          {/* Admin Master Link */}
          {currentUser && currentUser.role === 'admin' && (
            <div 
              className={`nav-item ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePage('admin')}
            >
              ⚙️ Admin Panel
            </div>
          )}
        </nav>

        {/* Global Persona Selector */}
        <div style={{ position: 'relative' }}>
          {currentUser ? (
            <div 
              className="role-badge-pill"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                {currentUser.role === 'reporter' ? (currentUser.reputation <= 50 ? '🌱 ' : currentUser.reputation <= 150 ? '✍️ ' : '🛡️ ') : ''}
                {currentUser.name}
              </span>
              <span className={`role-indicator-dot ${getRoleBadgeClass(currentUser.role)}`}></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>▼</span>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setActivePage('auth')}>
              Sign In
            </button>
          )}

        {/* Dropdown Menu Overlay */}
        {showRoleDropdown && (
          <div 
            style={{
              position: 'absolute',
              top: '60px',
              right: '20px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-md)',
              width: '260px',
              zIndex: 1010,
              padding: '0.5rem',
              animation: 'fadeIn 0.2s'
            }}
          >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                ⚡ QUICK PERSONA SIMULATOR
              </div>
              
              <div 
                onClick={() => handleRoleSelect('reader')}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-snappy)' }}
                className="nav-item"
              >
                <span className="role-indicator-dot reader"></span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>Sarah Connor</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role: General Reader (Rep: 15)</div>
                </div>
              </div>

              <div 
                onClick={() => handleRoleSelect('reporter')}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-snappy)' }}
                className="nav-item"
              >
                <span className="role-indicator-dot reporter"></span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>Jane Doe</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role: Citizen Reporter (Rep: 88)</div>
                </div>
              </div>

              <div 
                onClick={() => handleRoleSelect('verifier')}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-snappy)' }}
                className="nav-item"
              >
                <span className="role-indicator-dot verifier"></span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>David Smith</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role: Fact Checker (Rep: 99)</div>
                </div>
              </div>

              <div 
                onClick={() => handleRoleSelect('admin')}
                style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-snappy)' }}
                className="nav-item"
              >
                <span className="role-indicator-dot admin"></span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>Elena Rostova</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role: System Admin (Rep: 100)</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                📱 PWA & OFFLINE SANDBOX
              </div>
              
              <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulate Offline Mode</span>
                  <label style={{ display: 'inline-block', position: 'relative', width: '34px', height: '20px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={simulatedOffline} 
                      onChange={handleOfflineModeToggle} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: simulatedOffline ? 'var(--accent-blue)' : '#4a5568',
                      borderRadius: '20px',
                      transition: '0.2s',
                      boxShadow: simulatedOffline ? '0 0 6px var(--accent-blue)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '14px',
                        width: '14px',
                        left: simulatedOffline ? '16px' : '4px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.2s'
                      }} />
                    </span>
                  </label>
                </div>
                
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', width: '100%' }}
                  onClick={() => { setShowInstallBanner(true); setShowRoleDropdown(false); }}
                >
                  📲 Trigger Install Promotion
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.4rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '0.35rem', fontSize: '0.75rem' }} 
                  onClick={() => { setShowRoleDropdown(false); setActivePage('auth'); }}
                >
                  📝 Register Custom Profile
                </button>
                {currentUser && (
                  <button 
                    className="btn" 
                    style={{ 
                      width: '100%', 
                      padding: '0.35rem', 
                      fontSize: '0.75rem', 
                      background: 'rgba(229, 62, 98, 0.15)', 
                      color: 'var(--accent-red)', 
                      border: '1px solid rgba(229, 62, 98, 0.3)',
                      fontWeight: 700
                    }} 
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setCurrentUserLocal(null);
                      setCurrentUser(null);
                      localStorage.removeItem("citizen_news_current_user");
                      window.dispatchEvent(new Event("citizen_user_update"));
                      setActivePage('news');
                    }}
                  >
                    🚪 Sign Out
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </header>

      {/* Main Core View Area */}
      <main className="main-content">
        {renderActivePage()}
      </main>

      {/* Real-time Breaking News Alert Toast */}
      {activeAlert && (
        <div 
          onClick={() => {
            if (activeAlert.id && activeAlert.id.startsWith('ambient_')) {
              setActivePage('news');
            } else if (activeAlert.id) {
              setSelectedStoryId(activeAlert.id);
              setActivePage('news');
            }
            setActiveAlert(null);
          }}
          style={{
            position: 'fixed',
            top: '85px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '650px',
            background: 'rgba(9, 11, 14, 0.95)',
            border: '2px solid var(--accent-red)',
            boxShadow: '0 0 25px rgba(229, 62, 98, 0.4), var(--shadow-lg)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            zIndex: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            animation: 'slideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <div style={{
            background: 'var(--accent-red)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            letterSpacing: '0.08em',
            animation: 'pulseGlow 1.5s infinite',
            whiteSpace: 'nowrap'
          }}>
            BREAKING NEWS
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', margin: 0, fontWeight: 700, lineHeight: 1.3 }}>
              {activeAlert.title}
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>📍 {activeAlert.location}</span>
              <span>• Just Verified & Published</span>
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-dark)' }}>&rarr;</div>
        </div>
      )}

      {/* Premium Media Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '2rem 1.5rem', textAlign: 'center', background: 'rgba(9, 11, 14, 0.95)', zIndex: 10 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          🛡️ <strong>Citizen Journalism Verification & Publishing Platform</strong> &bull; Phase 1 Platform Deployment
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.4rem' }}>
          Strictly compliant with International Fact-Checking Network (IFCN) standards, UNESCO Media Literacy guidelines, and PIB factcheck protocols.
        </p>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.15)', marginTop: '1.25rem' }}>
          &copy; 2026 Citizen Sentinel Network. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
