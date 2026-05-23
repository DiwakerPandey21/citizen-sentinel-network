import { useState, useEffect } from 'react';
import { getStories, CATEGORIES, MAP_PINS } from '../db/initialData';

const getPinColor = (category, status = 'approved') => {
  if (status === 'pending') {
    return 'var(--accent-amber)'; // Pending unverified signals pulse amber
  }
  switch (category) {
    case 'safety': return 'var(--accent-red)';
    case 'environment': return 'var(--accent-green)';
    case 'healthcare': return 'var(--accent-blue)';
    case 'events': return 'var(--accent-amber)';
    default: return 'var(--accent-blue)';
  }
};

const getCategoryIcon = (catId) => {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? cat.icon : '📝';
};

// Stable pseudo-random coordinate generation for dynamic stories submitted/imported by user
const getDynamicPinCoords = (story) => {
  // 1. Check if we have pre-defined pins
  const staticPin = MAP_PINS.find(p => p.id === story.id);
  if (staticPin) {
    const loc = (story.location || '').toLowerCase();
    let sector = 'B'; // Default Central
    if (loc.includes('north') || loc.includes('suburb') || loc.includes('gate')) sector = 'A';
    else if (loc.includes('east') || loc.includes('metro') || loc.includes('pier') || loc.includes('bridge')) sector = 'C';
    else if (loc.includes('south') || loc.includes('greenbelt') || loc.includes('reserve')) sector = 'D';
    return { lat: staticPin.lat, lng: staticPin.lng, sector };
  }

  // 2. Parse location text dynamically to position in realistic sector bounds
  const loc = (story.location || '').toLowerCase();
  
  // Derive a stable id number so coordinates remain consistent on reload
  const cleanIdStr = story.id.replace(/[^\d]/g, '');
  const idNum = cleanIdStr ? parseInt(cleanIdStr, 10) : 500; // stable fallback instead of Math.random
  
  const seedX = (idNum % 20) - 10; // -10 to 10 offset
  const seedY = ((idNum * 3) % 20) - 10; // -10 to 10 offset

  if (loc.includes('north') || loc.includes('suburb') || loc.includes('gate')) {
    // Sector A: North Suburbs
    return { lat: 20 + seedY, lng: 25 + seedX, sector: 'A' };
  } else if (loc.includes('east') || loc.includes('metro') || loc.includes('pier') || loc.includes('bridge')) {
    // Sector C: Metro East
    return { lat: 76 + seedY, lng: 74 + seedX, sector: 'C' };
  } else if (loc.includes('south') || loc.includes('greenbelt') || loc.includes('reserve') || loc.includes('nature')) {
    // Sector D: South Suburbs
    return { lat: 82 + seedY, lng: 35 + seedX, sector: 'D' };
  } else {
    // Sector B: Central District
    return { lat: 48 + seedY, lng: 52 + seedX, sector: 'B' };
  }
};

export default function MapHub({ onNavigation, onSelectStory }) {
  const [stories, setStories] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Real-time municipal GPS coordinates
  const [coords, setCoords] = useState({ lat: '45.3082', lng: '75.1245', x: 0, y: 0, hover: false });
  const [mapMode, setMapMode] = useState('hud'); // 'hud' (cyber sweep) vs 'terrain' (vector topography)
  const [hoveredSector, setHoveredSector] = useState(null);

  // Load database stories and listen for live updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setStories(getStories());
    }, 0);
    
    const handleDbUpdate = () => {
      setStories(getStories());
    };
    window.addEventListener('citizen_db_update', handleDbUpdate);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('citizen_db_update', handleDbUpdate);
    };
  }, []);

  // Professional micro audio feedback for premium UI feel
  const playMapSound = (type = 'click') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.04);
        
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.008, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      }
    } catch (err) {
      console.debug("Audio play failed:", err);
    }
  };



  // Dynamically map stories from local storage
  const allDynamicPins = stories.map(story => {
    const coords = getDynamicPinCoords(story);
    return {
      id: story.id,
      title: story.title,
      category: story.category,
      status: story.status,
      lat: coords.lat,
      lng: coords.lng,
      sector: coords.sector,
      location: story.location,
      description: story.description,
      aiReport: story.aiReport,
      upvotes: story.upvotes,
      reporterName: story.reporterName
    };
  });

  // Filter map pins
  const filteredPins = allDynamicPins.filter(pin => {
    const matchesFilter = activeFilter === 'all' || pin.category === activeFilter;
    const isValidStatus = pin.status === 'approved' || pin.status === 'pending';
    return matchesFilter && isValidStatus;
  });

  const handlePinClick = (pin, e) => {
    e.stopPropagation();
    playMapSound('click');
    setSelectedPin(pin);
  };

  const handleReadFullStory = () => {
    if (!selectedPin) return;
    playMapSound('click');
    onSelectStory(selectedPin.id);
    onNavigation('news');
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    // Map percentages to realistic municipal GPS bounds
    const computedLat = (45.3120 - (yPct * 0.0052)).toFixed(4);
    const computedLng = (75.1204 + (xPct * 0.0094)).toFixed(4);
    
    setCoords({
      lat: computedLat,
      lng: computedLng,
      x: xPct,
      y: yPct,
      hover: true
    });
  };

  const getIntegrityScore = (pin) => {
    if (pin.aiReport && pin.aiReport.score) {
      return pin.aiReport.score;
    }
    const cleanId = pin.id.replace(/[^\d]/g, '');
    const idNum = cleanId ? parseInt(cleanId, 10) : 5;
    return 74 + (idNum % 23); // 74% - 96% stable fallback
  };

  const getSectorStats = (sectorId) => {
    const sectorPins = allDynamicPins.filter(pin => pin.sector === sectorId);
    const total = sectorPins.length;
    const safetyCount = sectorPins.filter(pin => pin.category === 'safety').length;
    const pendingCount = sectorPins.filter(pin => pin.status === 'pending').length;
    const approvedCount = sectorPins.filter(pin => pin.status === 'approved').length;
    
    const sectorNames = {
      'A': 'Sector A: North Suburbs',
      'B': 'Sector B: Central District',
      'C': 'Sector C: Metro East',
      'D': 'Sector D: South Suburbs'
    };
    const sectorName = sectorNames[sectorId] || `Sector ${sectorId}`;
    
    let status = '✓ Stable / Nominal';
    let statusColor = 'var(--accent-green)';
    if (safetyCount > 0) {
      status = '🚨 Critical Safety Alert';
      statusColor = 'var(--accent-red)';
    } else if (pendingCount > 0) {
      status = '⚠️ Active Investigation';
      statusColor = 'var(--accent-amber)';
    } else if (total > 0) {
      status = '✓ Active Verified Feeds';
      statusColor = 'var(--accent-blue)';
    }
    
    return {
      name: sectorName,
      total,
      safetyCount,
      pendingCount,
      approvedCount,
      status,
      statusColor
    };
  };

  return (
    <div style={{ animation: 'fadeIn 0.35s ease-out' }}>
      
      {/* Inline styles for next-level visual enhancements */}
      <style>{`
        @keyframes orbitSatellite {
          0% { transform: translate(120px, 80px) scale(0.95); }
          50% { transform: translate(720px, 390px) scale(1.05); }
          100% { transform: translate(120px, 80px) scale(0.95); }
        }
        @keyframes scanBeamAnimation {
          0% { opacity: 0.12; }
          50% { opacity: 0.28; }
          100% { opacity: 0.12; }
        }
        @keyframes pulseAmberRadar {
          0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(217, 119, 6, 0); }
          100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
        }
        @keyframes sweepRadarPulse {
          0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        .unverified-radar-ring {
          animation: pulseAmberRadar 1.5s infinite ease-out;
        }
        .verified-sonar-wave {
          position: absolute;
          border-radius: 50%;
          border: 1px solid currentColor;
          width: 40px;
          height: 40px;
          pointer-events: none;
          animation: sweepRadarPulse 2.5s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
        }
        .scanning-light-cone {
          animation: scanBeamAnimation 4s infinite ease-in-out;
        }
        .satellite-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 80px;
          height: 80px;
          pointer-events: none;
          z-index: 8;
          transform: translate(-50%, -50%);
          animation: orbitSatellite 24s infinite ease-in-out;
        }
        @keyframes decryptionProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px rgba(217, 119, 6, 0.2); }
          100% { box-shadow: 0 0 20px rgba(217, 119, 6, 0.6); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', letterSpacing: '-0.02em', fontWeight: 800 }}>
            🗺️ Municipal Hyperlocal GIS Map
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time municipal sector data stream. Hover over municipal sectors to view local analytics or select pin clusters to see community reports.
          </p>
        </div>
        
        {/* Futuristic Map Mode Selector */}
        <div style={{ display: 'flex', background: 'rgba(9, 11, 14, 0.7)', border: '1px solid var(--glass-border)', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            onClick={() => { playMapSound('click'); setMapMode('hud'); }}
            style={{ 
              background: mapMode === 'hud' ? 'var(--accent-blue)' : 'none', 
              color: '#ffffff', 
              border: 'none', 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              borderRadius: '6px', 
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            💻 TACTICAL HUD
          </button>
          <button 
            onClick={() => { playMapSound('click'); setMapMode('terrain'); }}
            style={{ 
              background: mapMode === 'terrain' ? 'var(--accent-blue)' : 'none', 
              color: '#ffffff', 
              border: 'none', 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              borderRadius: '6px', 
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            🗺️ VECTOR TERRAIN
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Control Panel & Live Dials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Municipal Map Telemetry Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'fadeIn 0.4s' }}>
            <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', margin: 0 }}>
              📊 Municipal Map Telemetry
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div className="telemetry-indicator" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>SYSTEM STATUS:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }}></span>
                  ONLINE
                </span>
              </div>
              <div className="telemetry-indicator" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>TOTAL PINNED INCIDENTS:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{allDynamicPins.length} Reports</span>
              </div>
              <div className="telemetry-indicator" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>ACTIVE INCIDENT FILTER:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  {activeFilter === 'all' ? 'All' : CATEGORIES.find(c => c.id === activeFilter)?.name || activeFilter}
                </span>
              </div>
              <div className="telemetry-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>GPS CURSOR POSITION:</span>
                <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                  {coords.hover ? `📍 ${coords.lat}° N / ${coords.lng}° W` : 'SAT_LINK_PENDING...'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Ward Analytics Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'fadeIn 0.4s' }}>
            <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', margin: 0 }}>
              📍 Grid Ward Analytics
            </h3>
            
            <div>
              {hoveredSector ? (() => {
                const stats = getSectorStats(hoveredSector);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {stats.name}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>WARD STATUS:</span>
                      <span style={{ color: stats.statusColor, fontWeight: 700 }}>{stats.status}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>ACTIVE STORIES:</span>
                      <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 600 }}>{stats.total} total</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.4rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid var(--glass-border)', marginTop: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span style={{ color: 'var(--accent-red)' }}>⚠️ PUBLIC SAFETY:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: stats.safetyCount > 0 ? 'var(--accent-red)' : '#ffffff' }}>{stats.safetyCount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span style={{ color: 'var(--accent-amber)' }}>📡 PENDING SIGNALS:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: stats.pendingCount > 0 ? 'var(--accent-amber)' : '#ffffff' }}>{stats.pendingCount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span style={{ color: 'var(--accent-green)' }}>✓ VERIFIED MUNICIPAL:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{stats.approvedCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <span style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', padding: '0.25rem 0' }}>
                  💡 Hover over map sectors (A, B, C, D) to inspect live ward telemetry.
                </span>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontWeight: 700 }}>
              🎯 Sector Incident Filters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className={`btn btn-secondary ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => { playMapSound('click'); setActiveFilter('all'); setSelectedPin(null); }}
                style={{ justifyContent: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', background: activeFilter === 'all' ? 'rgba(255,255,255,0.05)' : '' }}
              >
                🌐 All Municipal Wards
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  className={`btn btn-secondary ${activeFilter === cat.id ? 'active' : ''}`}
                  onClick={() => { playMapSound('click'); setActiveFilter(cat.id); setSelectedPin(null); }}
                  style={{ 
                    justifyContent: 'flex-start', 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.85rem', 
                    width: '100%',
                    borderLeft: `3px solid ${cat.color}`, 
                    background: activeFilter === cat.id ? 'rgba(255,255,255,0.05)' : '' 
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>
              <strong style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem', color: '#ffffff' }}>LEGEND KEY:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div className="flex-align"><span className="role-indicator-dot safety"></span> Public Safety Hotspot</div>
                <div className="flex-align"><span className="role-indicator-dot reader"></span> Environment / Ecology</div>
                <div className="flex-align"><span className="role-indicator-dot verifier"></span> Community & Events</div>
                <div className="flex-align"><span className="role-indicator-dot reporter"></span> Critical Infrastructure</div>
                <div className="flex-align" style={{ marginTop: '0.2rem', padding: '0.2rem 0.4rem', borderRadius: '3px', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.15)', color: 'var(--accent-amber)' }}>
                  <span className="role-indicator-dot pending" style={{ background: 'var(--accent-amber)' }}></span> Pending Unverified Signal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Canvas News Map Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div 
            className="map-canvas-container" 
            onClick={() => setSelectedPin(null)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCoords(prev => ({ ...prev, hover: false }))}
            style={{ 
              height: '520px',
              cursor: 'crosshair',
              background: mapMode === 'hud' 
                ? 'radial-gradient(circle at center, #0f131a 0%, #06080b 100%)' 
                : 'radial-gradient(circle at center, #1b212f 0%, #0d1117 100%)',
              transition: 'background 0.5s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Grid Coordinates Overlay */}
            <div className="map-grid-overlay" style={{ opacity: mapMode === 'hud' ? 0.85 : 0.4 }}></div>
            
            {/* Real-time Dynamic Laser Crosshair reticle */}
            {coords.hover && (
              <>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${coords.y}%`,
                  height: '1px',
                  background: 'rgba(99, 179, 237, 0.25)',
                  pointerEvents: 'none',
                  zIndex: 2
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${coords.x}%`,
                  width: '1px',
                  background: 'rgba(99, 179, 237, 0.25)',
                  pointerEvents: 'none',
                  zIndex: 2
                }} />
                <div style={{
                  position: 'absolute',
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '1px solid var(--accent-blue)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 2,
                  boxShadow: '0 0 8px rgba(99, 179, 237, 0.6)'
                }} />
                
                {/* Floating GPS text badge near cursor */}
                <div style={{
                  position: 'absolute',
                  left: coords.x > 80 ? `${coords.x - 22}%` : `${coords.x + 2}%`,
                  top: coords.y > 85 ? `${coords.y - 10}%` : `${coords.y + 2}%`,
                  background: 'rgba(6, 8, 12, 0.95)',
                  border: '1px solid var(--accent-blue)',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  color: 'var(--accent-blue)',
                  pointerEvents: 'none',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  zIndex: 5,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                }}>
                  📍 {coords.lat}° N / {coords.lng}° W
                </div>
              </>
            )}

            {/* Rotating / Sweeping High-Tech Sonar Line */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '180px',
              background: 'linear-gradient(to right, transparent, rgba(99, 179, 237, 0.12) 60%, rgba(99, 179, 237, 0.3) 98%, #63b3ed)',
              borderRight: '1.5px solid #63b3ed',
              boxShadow: '0 0 25px rgba(99, 179, 237, 0.25)',
              pointerEvents: 'none',
              zIndex: 3,
              animation: 'sonarSweep 8s infinite linear'
            }} />

            {/* HIGH-FIDELITY VECTOR TOPOGRAPHY OVERLAY */}
            <svg 
              viewBox="0 0 1000 520"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none', 
                opacity: mapMode === 'hud' ? 0.35 : 0.68, 
                zIndex: 1,
                transition: 'opacity 0.5s ease'
              }}
            >
              {/* Interactive Sector Polygons (A, B, C, D) */}
              {/* Sector A - North Suburbs */}
              <polygon
                points="0,0 520,0 480,260 0,260"
                fill={hoveredSector === 'A' ? 'rgba(99, 179, 237, 0.08)' : 'rgba(99, 179, 237, 0.015)'}
                stroke={hoveredSector === 'A' ? 'rgba(99, 179, 237, 0.5)' : 'rgba(99, 179, 237, 0.12)'}
                strokeWidth={hoveredSector === 'A' ? 2 : 1}
                style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.25s ease' }}
                onMouseEnter={() => { setHoveredSector('A'); playMapSound('hover'); }}
                onMouseLeave={() => setHoveredSector(null)}
              />

              {/* Sector B - Central District */}
              <polygon
                points="520,0 1000,0 1000,260 480,260"
                fill={hoveredSector === 'B' ? 'rgba(99, 179, 237, 0.08)' : 'rgba(99, 179, 237, 0.015)'}
                stroke={hoveredSector === 'B' ? 'rgba(99, 179, 237, 0.5)' : 'rgba(99, 179, 237, 0.12)'}
                strokeWidth={hoveredSector === 'B' ? 2 : 1}
                style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.25s ease' }}
                onMouseEnter={() => { setHoveredSector('B'); playMapSound('hover'); }}
                onMouseLeave={() => setHoveredSector(null)}
              />

              {/* Sector C - Metro East */}
              <polygon
                points="480,260 1000,260 1000,520 440,520"
                fill={hoveredSector === 'C' ? 'rgba(99, 179, 237, 0.08)' : 'rgba(99, 179, 237, 0.015)'}
                stroke={hoveredSector === 'C' ? 'rgba(99, 179, 237, 0.5)' : 'rgba(99, 179, 237, 0.12)'}
                strokeWidth={hoveredSector === 'C' ? 2 : 1}
                style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.25s ease' }}
                onMouseEnter={() => { setHoveredSector('C'); playMapSound('hover'); }}
                onMouseLeave={() => setHoveredSector(null)}
              />

              {/* Sector D - South Suburbs */}
              <polygon
                points="0,260 480,260 440,520 0,520"
                fill={hoveredSector === 'D' ? 'rgba(99, 179, 237, 0.08)' : 'rgba(99, 179, 237, 0.015)'}
                stroke={hoveredSector === 'D' ? 'rgba(99, 179, 237, 0.5)' : 'rgba(99, 179, 237, 0.12)'}
                strokeWidth={hoveredSector === 'D' ? 2 : 1}
                style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.25s ease' }}
                onMouseEnter={() => { setHoveredSector('D'); playMapSound('hover'); }}
                onMouseLeave={() => setHoveredSector(null)}
              />

              {/* Glowing river path */}
              <path d="M 320,-20 Q 280,140 310,240 T 360,540" fill="none" stroke="#2b6cb0" strokeWidth="24" strokeLinecap="round" />
              <path d="M 320,-20 Q 280,140 310,240 T 360,540" fill="none" stroke="#63b3ed" strokeWidth="2" strokeDasharray="8,4" />

              {/* Highway Bridges */}
              <line x1="270" y1="140" x2="330" y2="135" stroke="#ffffff" strokeWidth="4" opacity="0.6" />
              <line x1="300" y1="340" x2="360" y2="340" stroke="#ffffff" strokeWidth="4" opacity="0.6" />

              {/* Stylized streets network grid */}
              {/* West Side Grid */}
              <path d="M 50,40 L 250,40 M 20,120 L 280,120 M 30,220 L 290,220 M 10,320 L 300,320 M 40,420 L 330,420" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <path d="M 60,10 L 60,460 M 140,20 L 140,480 M 220,10 L 220,440" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              
              {/* East Side Grid */}
              <path d="M 360,80 L 900,80 M 350,180 L 950,180 M 370,280 L 920,280 M 380,380 L 910,380 M 390,460 L 950,460" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <path d="M 450,20 L 450,490 M 580,10 L 580,480 M 720,20 L 720,470 M 860,10 L 860,490" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

              {/* Cyber GIS Topography Concentric circles */}
              <circle cx="140" cy="120" r="70" fill="none" stroke="rgba(99, 179, 237, 0.08)" strokeWidth="1" />
              <circle cx="140" cy="120" r="120" fill="none" stroke="rgba(99, 179, 237, 0.04)" strokeWidth="1" />
              <circle cx="720" cy="280" r="90" fill="none" stroke="rgba(99, 179, 237, 0.08)" strokeWidth="1" />
              <circle cx="720" cy="280" r="150" fill="none" stroke="rgba(99, 179, 237, 0.04)" strokeWidth="1" />

              {/* Runway / Transit Corridor */}
              <path d="M 50,460 L 950,20" fill="none" stroke="rgba(99, 179, 237, 0.15)" strokeWidth="2" strokeDasharray="15,10" />
            </svg>

            {/* Radar Sweep Circle Centers */}
            <div className="map-radar-pulse" style={{ top: '10%', left: '15%' }}></div>
            <div className="map-radar-pulse" style={{ top: '65%', left: '70%', animationDelay: '2.5s' }}></div>

            {/* NEXT-LEVEL ORBITING SATELLITE WITH ACTIVE BEAM SWEEP */}
            <div className="satellite-wrapper">
              <svg width="80" height="80" viewBox="0 0 100 100">
                {/* Visual Satellite body */}
                <rect x="42" y="32" width="16" height="16" fill="var(--accent-blue)" rx="2" stroke="#ffffff" strokeWidth="1" />
                <rect x="22" y="36" width="16" height="8" fill="rgba(99, 179, 237, 0.95)" rx="1" stroke="var(--accent-blue)" strokeWidth="0.5" />
                <rect x="62" y="36" width="16" height="8" fill="rgba(99, 179, 237, 0.95)" rx="1" stroke="var(--accent-blue)" strokeWidth="0.5" />
                <line x1="38" y1="40" x2="42" y2="40" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="58" y1="40" x2="62" y2="40" stroke="#ffffff" strokeWidth="1.5" />
                {/* Antenna dish */}
                <path d="M 50,32 Q 50,24 53,20" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="53" cy="20" r="2" fill="var(--accent-red)" />
                {/* Scanning sweep projection gradient */}
                <polygon points="50,40 10,95 90,95" fill="url(#sat-beam-gradient)" className="scanning-light-cone" />
                
                <defs>
                  <linearGradient id="sat-beam-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Sector Labels (Translucent glowing style) */}
            <div style={{ position: 'absolute', top: '8%', left: '4%', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>
              GRID_ZONE // SECTOR A (NORTH SUBURBS)
            </div>
            <div style={{ position: 'absolute', top: '48%', left: '45%', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>
              GRID_ZONE // SECTOR B (CENTRAL DISTRICT)
            </div>
            <div style={{ position: 'absolute', top: '82%', left: '72%', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>
              GRID_ZONE // SECTOR C (METRO EAST)
            </div>
            <div style={{ position: 'absolute', top: '90%', left: '4%', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>
              GRID_ZONE // SECTOR D (SOUTH SUBURBS)
            </div>

            {/* Winding Metro Waterway HUD Label */}
            <div style={{ 
              position: 'absolute', 
              top: '40%', 
              left: '32%', 
              color: 'rgba(99, 179, 237, 0.4)', 
              transform: 'translateX(-50%) rotate(72deg)', 
              fontSize: '0.55rem', 
              fontFamily: 'monospace',
              letterSpacing: '0.3em',
              fontWeight: 800
            }}>
              METRO WATERWAY [GIS_02]
            </div>

            {/* Dynamic Rendering of Interactive Map Pins */}
            {filteredPins.map(pin => {
              const color = getPinColor(pin.category, pin.status);
              const isSelected = selectedPin && selectedPin.id === pin.id;
              
              return (
                <div 
                  key={pin.id}
                  className="map-pin-marker"
                  style={{ 
                    top: `${pin.lat}%`, 
                    left: `${pin.lng}%`, 
                    color: color,
                    zIndex: isSelected ? 999 : 10 
                  }}
                  onClick={(e) => handlePinClick(pin, e)}
                >
                  {/* Dynamic Sonar Sweeper expansion for active verified reports */}
                  {pin.status === 'approved' && <div className="verified-sonar-wave" style={{ color: color }} />}
                  
                  {/* Glowing Radar Target Beacon */}
                  <div 
                    className={`pin-ring ${pin.status === 'pending' ? 'unverified-radar-ring' : ''}`}
                    style={{ 
                      color: color, 
                      animation: isSelected ? 'pulseGlow 1.0s infinite' : '',
                      border: isSelected ? '2.5px solid currentColor' : `1.5px solid ${pin.status === 'pending' ? 'var(--accent-amber)' : 'rgba(255,255,255,0.25)'}`,
                      background: isSelected ? 'rgba(9, 11, 14, 0.95)' : 'rgba(9, 11, 14, 0.55)',
                      width: isSelected ? '32px' : '24px',
                      height: isSelected ? '32px' : '24px',
                      transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      boxShadow: isSelected ? `0 0 15px ${color}` : `0 0 6px ${pin.status === 'pending' ? 'rgba(217, 119, 6, 0.5)' : 'none'}`
                    }}
                  >
                    <div 
                      className="pin-dot" 
                      style={{ 
                        background: color, 
                        width: isSelected ? '10px' : '7px',
                        height: isSelected ? '10px' : '7px',
                        borderRadius: '50%',
                        transition: 'all 0.25s'
                      }}
                    ></div>
                  </div>
                  
                  {/* Cyber Pin Title Tag */}
                  <span style={{ 
                    position: 'absolute', 
                    top: isSelected ? '34px' : '29px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: isSelected ? 'rgba(6, 8, 12, 0.95)' : 'rgba(9, 11, 14, 0.85)', 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '4px', 
                    border: isSelected ? `1.5px solid ${color}` : pin.status === 'pending' ? '1px dashed var(--accent-amber)' : '1px solid var(--glass-border)', 
                    fontSize: '0.65rem', 
                    whiteSpace: 'nowrap', 
                    color: '#ffffff', 
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    boxShadow: isSelected ? `0 0 12px ${color}` : '0 2px 8px rgba(0,0,0,0.5)',
                    transition: 'all 0.25s'
                  }}>
                    {pin.status === 'pending' ? '⚠️' : getCategoryIcon(pin.category)} {pin.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}

            {/* Satisfying Bottom-Right Details Slide Popup */}
            {selectedPin && (
              <div 
                className="map-card-popup" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  borderLeft: `5px solid ${getPinColor(selectedPin.category, selectedPin.status)}`,
                  animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: 'rgba(11, 15, 23, 0.96)',
                  boxShadow: '0 15px 45px rgba(0, 0, 0, 0.85), 0 0 20px rgba(99,179,237,0.15)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  maxWidth: '430px'
                }}
              >
                {/* Telemetry decryption scanner bar */}
                <div style={{
                  height: '2px',
                  width: '100%',
                  background: getPinColor(selectedPin.category, selectedPin.status),
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  boxShadow: `0 0 10px ${getPinColor(selectedPin.category, selectedPin.status)}`,
                  opacity: selectedPin.status === 'pending' ? 0.8 : 0.3
                }} />

                <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    color: getPinColor(selectedPin.category, selectedPin.status), 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.12em', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem' 
                  }}>
                    {selectedPin.status === 'pending' ? '⚠️ UNVERIFIED SIGNAL REPORT' : '✓ VERIFIED MUNICIPAL FEED'}
                  </span>
                  
                  <button 
                    onClick={() => setSelectedPin(null)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.25rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    &times;
                  </button>
                </div>
                
                <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.35rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  {selectedPin.title}
                </h4>
                
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '0.4rem 0 0.75rem 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>📍 Location: <strong>{selectedPin.location}</strong></span>
                  <span>👤 Reporter: <strong>{selectedPin.reporterName || 'Anonymous'}</strong></span>
                </div>

                <p style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255,255,255,0.72)', 
                  lineHeight: 1.5, 
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.01)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  {selectedPin.description}
                </p>

                {/* Cyber Diagnostic Analytics HUD block */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.6rem',
                  marginTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '0.75rem'
                }}>
                  {/* Integrity Confidence score visual */}
                  <div style={{ background: 'rgba(9, 11, 14, 0.5)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                      <span>CONFIDENCE INDEX</span>
                      <span style={{ 
                        color: selectedPin.status === 'pending' ? 'var(--accent-amber)' : getPinColor(selectedPin.category), 
                        fontWeight: 700 
                      }}>
                        {selectedPin.status === 'pending' ? 'PENDING_VERIFY' : `${getIntegrityScore(selectedPin)}%`}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem' }}>
                      <div style={{ 
                        width: selectedPin.status === 'pending' ? '30%' : `${getIntegrityScore(selectedPin)}%`, 
                        height: '100%', 
                        background: selectedPin.status === 'pending' ? 'var(--accent-amber)' : getPinColor(selectedPin.category)
                      }} />
                    </div>
                  </div>

                  {/* Threat / Severity classification level */}
                  <div style={{ background: 'rgba(9, 11, 14, 0.5)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-dark)', fontWeight: 600 }}>INCIDENT IMPACT LEVEL</div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      color: selectedPin.category === 'safety' ? 'var(--accent-red)' : selectedPin.category === 'infrastructure' ? 'var(--accent-blue)' : 'var(--accent-green)',
                      marginTop: '0.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>{selectedPin.category === 'safety' ? '⚡ CRITICAL / SEVERE' : selectedPin.category === 'infrastructure' ? '🚧 ELEVATED IMPACT' : '✓ STABLE / LIGHT'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    🔥 {selectedPin.upvotes || 0} Upvoted Matches
                  </span>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={handleReadFullStory}
                    style={{ 
                      padding: '0.4rem 1.0rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 800,
                      background: getPinColor(selectedPin.category, selectedPin.status),
                      borderColor: 'transparent',
                      color: selectedPin.status === 'pending' ? '#000000' : '#ffffff',
                      boxShadow: `0 0 10px ${getPinColor(selectedPin.category, selectedPin.status)}`
                    }}
                  >
                    📖 VIEW FULL REPORT
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="glass-card" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem', animation: 'signalPulse 2s infinite ease-in-out' }}>🛰️</span>
            <span>
              <strong>Active GIS Stream:</strong> All marked coordinate clusters map directly to active community reports. In accordance with IFCN fact-checking protocols, unverified incidents are clearly demarcated on public overlays to encourage source verification.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
