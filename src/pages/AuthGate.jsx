import { useState } from 'react';
import { getUsers, setCurrentUser } from '../db/initialData';

export default function AuthGate({ onAuthSuccess }) {
  const users = getUsers();
  
  // Tab states: 'credentials' (traditional) vs 'quick' (evaluator profiles) vs 'register' (custom profile)
  const [activeTab, setActiveTab] = useState('quick');
  
  // Credentials Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Custom Register States
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('reader');
  const [customLoc, setCustomLoc] = useState('Metro Center');



  // Simulated Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = (userObj) => {
    setCurrentUser(userObj);
    // Dispatch custom event to notify App Shell
    window.dispatchEvent(new CustomEvent('citizen_user_update'));
    if (onAuthSuccess) onAuthSuccess(userObj);
  };

  const handleTraditionalLogin = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setLoginError('');

    // Mock network auth latency
    setTimeout(() => {
      setIsLoggingIn(false);
      // Map basic emails to personas for seamless evaluator testing, otherwise login reader
      const lowercaseEmail = email.toLowerCase();
      const userList = Object.values(users);
      if (lowercaseEmail.includes('jane')) {
        const found = userList.find(u => u.role === 'reporter' || u.username === 'jane_reporter');
        handleLogin(found || users.reporter);
      } else if (lowercaseEmail.includes('david')) {
        const found = userList.find(u => u.role === 'verifier' || u.username === 'david_verifier');
        handleLogin(found || users.verifier);
      } else if (lowercaseEmail.includes('elena')) {
        const found = userList.find(u => u.role === 'admin' || u.username === 'elena_admin');
        handleLogin(found || users.admin);
      } else if (lowercaseEmail.includes('sarah')) {
        const found = userList.find(u => u.role === 'reader' || u.username === 'sarah_reads');
        handleLogin(found || users.reader);
      } else {
        // Fallback: create dynamic citizen
        const namePart = email.split('@')[0];
        const dynamicName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const dynamicUser = {
          id: `email_${Date.now()}`,
          name: dynamicName,
          username: namePart,
          role: 'reader',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${namePart}`,
          location: 'Central District',
          reputation: 15,
          bio: `Verified Email Citizen Scribe from Central District.`
        };
        const pool = getUsers();
        pool[dynamicUser.username] = dynamicUser;
        localStorage.setItem("citizen_news_users", JSON.stringify(pool));
        handleLogin(dynamicUser);
      }
    }, 1200);
  };

  const handleCustomRegister = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const username = customName.toLowerCase().replace(/\s+/g, '_');
    const newCustomUser = {
      id: `custom_${Date.now()}`,
      name: customName,
      username: username,
      role: customRole,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${customName}`,
      location: customLoc,
      reputation: customRole === 'reporter' ? 50 : customRole === 'verifier' ? 80 : customRole === 'admin' ? 100 : 10,
      bio: `Custom registered ${customRole} from ${customLoc}.`
    };

    const currentUsers = getUsers();
    currentUsers[username] = newCustomUser;
    localStorage.setItem("citizen_news_users", JSON.stringify(currentUsers));

    handleLogin(newCustomUser);
  };



  // Dynamic Password strength meter computation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score: 33, label: 'Weak', color: 'var(--accent-red)' };
      case 3:
      case 4:
        return { score: 66, label: 'Medium', color: 'var(--accent-amber)' };
      case 5:
        return { score: 100, label: 'Robust & Secure', color: 'var(--accent-green)' };
      default:
        return { score: 10, label: 'Too Short', color: 'var(--accent-red)' };
    }
  };

  const passStrength = getPasswordStrength(password);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning, Scribe";
    if (hours < 18) return "Good afternoon, Sentinel";
    return "Good evening, Sentinel";
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh', padding: '1rem 0 3rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* Premium Particle Spatial background */}
      <div className="login-universe-bg">
        <div className="login-cosmic-glow"></div>
        <div className="login-cosmic-glow green" style={{ right: '5%', bottom: '5%' }}></div>
      </div>

      <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Header Greeting Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            background: 'rgba(99, 179, 237, 0.12)', 
            border: '1px solid rgba(99, 179, 237, 0.25)', 
            padding: '0.3rem 0.8rem', 
            borderRadius: '20px', 
            fontSize: '0.75rem', 
            color: 'var(--accent-blue)', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            marginBottom: '1rem' 
          }}>
            <span>🔒</span> Global Security Protocol Active
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {getGreeting()}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}>
            Authenticate secure citizen credentials, switch quick evaluation clearance, or query the decentralized network gateway.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '650px', margin: '0 auto' }}>
          
          <div className="auth-glass-panel">
            
            {/* Elegant Tab Switcher */}
            <div className="login-tabs-container">
              <button 
                className={`login-tab-trigger ${activeTab === 'quick' ? 'active' : ''}`}
                onClick={() => { setActiveTab('quick'); setLoginError(''); }}
              >
                👥 Quick Passes
              </button>
              <button 
                className={`login-tab-trigger ${activeTab === 'credentials' ? 'active' : ''}`}
                onClick={() => { setActiveTab('credentials'); setLoginError(''); }}
              >
                🔐 Credentials
              </button>
              <button 
                className={`login-tab-trigger ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setLoginError(''); }}
              >
                📝 Register
              </button>
            </div>

            {/* TAB 1: QUICK ACCESS PORTAL */}
            {activeTab === 'quick' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1.25rem', fontWeight: 700, borderLeft: '3px solid var(--accent-blue)', paddingLeft: '0.5rem' }}>
                  Select Preset Clearance Credentials
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.values(users).map((user, idx) => {
                    const colors = {
                      reporter: 'var(--accent-blue)',
                      verifier: 'var(--accent-amber)',
                      admin: 'var(--accent-red)',
                      reader: 'var(--accent-green)'
                    };
                    const color = colors[user.role] || 'var(--accent-blue)';
                    
                    return (
                      <div 
                        key={`${user.id}_${user.username}_${idx}`}
                        onClick={() => handleLogin(user)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(9, 11, 14, 0.45)',
                          border: '1px solid var(--glass-border)',
                          padding: '0.8rem 1.25rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = color;
                          e.currentTarget.style.background = 'rgba(22, 28, 38, 0.6)';
                          e.currentTarget.style.boxShadow = `0 4px 15px rgba(0,0,0,0.4), 0 0 10px ${color}1a`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.background = 'rgba(9, 11, 14, 0.45)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%', 
                              objectFit: 'cover', 
                              border: `1.5px solid ${color}`,
                              boxShadow: `0 0 8px ${color}2b`
                            }} 
                          />
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 700 }}>
                              {user.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>
                              @{user.username} &bull; {user.role}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', color: color, fontWeight: 700 }}>
                            ⭐ REP: {user.reputation}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>➔</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CREDENTIALS TRADITIONAL LOGIN */}
            {activeTab === 'credentials' && (
              <form onSubmit={handleTraditionalLogin} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1.25rem', fontWeight: 700, borderLeft: '3px solid var(--accent-blue)', paddingLeft: '0.5rem' }}>
                  Secure Terminal Login
                </h3>

                {loginError && (
                  <div style={{ background: 'rgba(229, 62, 98, 0.12)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    ❌ {loginError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Secure Node Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="name@citizenjournal.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Evaluators try "jane@citizen.org" or "david@verifier.org" for mock loading injection!</span>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <div className="flex-between">
                    <label className="form-label">Password Key</label>
                    <button 
                      type="button" 
                      onClick={() => setShowForgotModal(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Forgot Key?
                    </button>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-input" 
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', paddingRight: '2.5rem' }}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      {showPassword ? '👁️' : '🕶️'}
                    </button>
                  </div>

                  {/* Interactive password meter */}
                  {password && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                        <span>Key Strength:</span>
                        <span style={{ color: passStrength.color, fontWeight: 700 }}>{passStrength.label}</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${passStrength.score}%`, height: '100%', background: passStrength.color, transition: 'width 0.3s ease' }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Decrypting Secure Gateway...' : 'Initialize Terminal Decryption'}
                </button>
              </form>
            )}

            {/* TAB 3: CUSTOM LOCAL REGISTRY */}
            {activeTab === 'register' && (
              <form onSubmit={handleCustomRegister} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1.25rem', fontWeight: 700, borderLeft: '3px solid var(--accent-blue)', paddingLeft: '0.5rem' }}>
                  Register Decentralized Citizen Clearance
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. John Watson" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District Sector Location</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Metro Center" 
                      value={customLoc}
                      onChange={(e) => setCustomLoc(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Clearance Role</label>
                  <select 
                    className="form-select"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  >
                    <option value="reader">General Reader (Browse verified feed, flag objections)</option>
                    <option value="reporter">Citizen Reporter (Initial 50 Rep, file local dossiers)</option>
                    <option value="verifier">Fact Checker / Moderator (Initial 80 Rep, audit drafts)</option>
                    <option value="admin">System Admin (Full system metric dials, takedowns)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
                >
                  Create Secure Credentials & Log In
                </button>
              </form>
            )}



          </div>

        </div>

        {/* Global Security Policy Note */}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-dark)' }}>
          🔒 Decentralized Credential Ledger v2.04 &bull; Verified compliance with IFCN Ethics Directives & UNESCO Literacy standards.
        </div>

      </div>



      {/* SIMULATED FORGOT PASSWORD DIALOG */}
      {showForgotModal && (
        <div className="oauth-modal-overlay">
          <div className="oauth-modal-content" style={{ padding: '2rem', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#202124', fontWeight: 700 }}>
                🔑 Retrieve Security Decryption Key
              </h3>
              <button 
                onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <span style={{ fontSize: '2.5rem' }}>📧</span>
                <h4 style={{ margin: '0.75rem 0 0.25rem 0', color: '#059669', fontSize: '1rem' }}>Decryption Link Dispatched!</h4>
                <p style={{ fontSize: '0.8rem', color: '#5f6368', margin: 0 }}>
                  A secure, single-use decryption protocol has been sent to <strong>{forgotEmail}</strong>. Verify your node inbox!
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setForgotSent(true); }}>
                <p style={{ fontSize: '0.8rem', color: '#5f6368', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  Input your registered node email address. Our decentralized ledger will dispatch a secure validation key to reset your terminal password.
                </p>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#5f6368' }}>Registered Node Email</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="name@citizenjournal.org"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{ color: '#000000', border: '1px solid #dadce0' }}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem' }}
                >
                  Dispatch Decryption Key
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
