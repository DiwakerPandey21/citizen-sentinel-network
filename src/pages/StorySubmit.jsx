import { useState, useEffect } from 'react';
import { getStories, saveStories, getCurrentUser, CATEGORIES } from '../db/initialData';

const MOCK_MEDIA_LIBRARY = [
  { url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800', caption: 'Road/Bridge Crack close-up' },
  { url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', caption: 'Unmarked trench open pit' },
  { url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=800', caption: 'Chemical water pollution run-off' },
  { url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800', caption: 'Clinic vaccine shortage queue' },
  { url: 'https://images.unsplash.com/photo-1513826358818-466f99ec3f1d?w=800', caption: 'Traffic blockage gridlock' },
  { url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800', caption: 'Freight truck municipal highway' }
];

export default function StorySubmit({ onNavigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [location, setLocation] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [sourcesList, setSourcesList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [aiReport, setAiReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentUser(getCurrentUser());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const generateAiReportData = (t, d, loc, sources) => {
    const sensationalWords = ['shocking', 'unbelievable', 'exposed', 'scam', 'conspiracy', 'magic', 'alien', 'secret', 'horrific', 'disaster', 'corrupt', 'must watch', 'hackers', 'furious', 'scandal', 'mind-blowing'];
    const lowercaseTitle = t.toLowerCase();
    const flaggedTitleWords = sensationalWords.filter(word => lowercaseTitle.includes(word));
    const hasTitleExclamation = t.includes('!');
    
    const titleWords = t.split(/\s+/);
    const allCapsWords = titleWords.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));

    const emotionalWords = ['horrific', 'disaster', 'terrible', 'disgrace', 'evil', 'idiots', 'liars', 'scumbags', 'ruining', 'hate', 'stupid', 'garbage', 'furious', 'criminals'];
    const lowercaseDesc = d.toLowerCase();
    const flaggedDescWords = emotionalWords.filter(word => lowercaseDesc.includes(word));

    const hasNumbers = /\d+/.test(d) || /\d+/.test(loc);
    const properNounRegex = /\b[A-Z][a-z]+\b/g;
    const properNouns = (d.match(properNounRegex) || []).filter(w => !['The', 'A', 'An', 'I', 'He', 'She', 'They', 'It', 'We', 'In', 'On', 'At', 'By', 'To'].includes(w));
    const uniquenessProperNouns = [...new Set(properNouns)];

    let score = 60; // Base score
    let deductions = [];
    let bonuses = [];

    if (flaggedTitleWords.length > 0) {
      score -= 15;
      deductions.push(`Sensational language in headline: "${flaggedTitleWords.join(', ')}"`);
    }
    if (hasTitleExclamation) {
      score -= 10;
      deductions.push("Headline contains exclamation marks (reduces objective tone)");
    }
    if (allCapsWords.length > 0) {
      score -= 15;
      deductions.push(`ALL CAPS words in headline: "${allCapsWords.join(', ')}"`);
    }

    if (flaggedDescWords.length > 0) {
      score -= 15;
      deductions.push(`Subjective/emotional language in description: "${flaggedDescWords.join(', ')}"`);
    }

    if (d.length > 150) {
      score += 10;
      bonuses.push("Detailed description provides substantial reading context (>150 chars)");
    } else {
      score -= 10;
      deductions.push("Short description (<150 chars) lacks deep context");
    }

    if (hasNumbers) {
      score += 10;
      bonuses.push("Spatiotemporal cues (numbers, dates, or identifiers) are present");
    } else {
      score -= 5;
      deductions.push("Lacks numeric identifiers (dates, times, counts, pillar numbers)");
    }

    if (uniquenessProperNouns.length >= 3) {
      score += 10;
      bonuses.push(`Rich entity specificity: identified landmarks/proper nouns (${uniquenessProperNouns.slice(0, 3).join(', ')})`);
    }

    if (sources && sources.length > 0) {
      const sourceBonus = Math.min(sources.length * 10, 20);
      score += sourceBonus;
      bonuses.push(`Supporting sources attached (+${sourceBonus}%)`);
    } else {
      score -= 10;
      deductions.push("No verification references or citations attached yet");
    }

    score = Math.max(0, Math.min(score, 100));

    return {
      score,
      deductions,
      bonuses,
      flaggedTitleWords,
      flaggedDescWords,
      properNouns: uniquenessProperNouns,
      isSensational: flaggedTitleWords.length > 0 || hasTitleExclamation || allCapsWords.length > 0
    };
  };

  const runAiPreAudit = () => {
    if (!title.trim() || !description.trim()) {
      alert('Please provide at least a Title and Description first!');
      return;
    }
    setIsAnalyzing(true);
    setAiReport(null);
    setTimeout(() => {
      const report = generateAiReportData(title, description, location, sourcesList);
      setAiReport(report);
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleAddSource = () => {
    if (sourceInput.trim() && !sourcesList.includes(sourceInput.trim())) {
      setSourcesList([...sourcesList, sourceInput.trim()]);
      setSourceInput('');
    }
  };

  const handleRemoveSource = (idx) => {
    setSourcesList(sourcesList.filter((_, i) => i !== idx));
  };

  const handleToggleMedia = (mediaObj) => {
    if (selectedMedia.some(m => m.url === mediaObj.url)) {
      setSelectedMedia(selectedMedia.filter(m => m.url !== mediaObj.url));
    } else {
      setSelectedMedia([...selectedMedia, mediaObj]);
    }
  };

  const handleSubmitStory = (statusType) => {
    if (!title.trim() || !description.trim() || !location.trim() || !currentUser) {
      alert('Please fill out all mandatory fields (Title, Description, and Location) before submitting!');
      return;
    }

    const finalAiReport = aiReport || generateAiReportData(title, description, location, sourcesList);

    const newStory = {
      id: `story_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: category,
      location: location.trim(),
      media: selectedMedia.length > 0 ? selectedMedia : [
        { url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800', caption: 'Citizen Journalism Report Graphic' }
      ],
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterAvatar: currentUser.avatar,
      date: new Date().toISOString(),
      status: statusType, // 'draft' or 'pending'
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      flags: [],
      sourceReferences: sourcesList.length > 0 ? sourcesList : ['Citizen reporter eyewitness details'],
      reviewerComments: '',
      verifiedAt: null,
      verifiedBy: null,
      aiScore: finalAiReport.score,
      aiReport: finalAiReport
    };

    // Save story to local database
    const dbStories = getStories();
    saveStories([newStory, ...dbStories]);

    // Show success banner
    setSubmitSuccess(true);
    
    // Clear form
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0].id);
    setLocation('');
    setSourcesList([]);
    setSelectedMedia([]);
    setStep(1);

    setTimeout(() => {
      setSubmitSuccess(false);
      // Navigate back to dashboard
      if (onNavigation) onNavigation('dashboard');
    }, 2000);
  };

  const nextStep = () => {
    if (step === 1 && (!title.trim() || !description.trim())) {
      alert('Please provide a Story Title and Description before moving to the next step!');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (!currentUser || currentUser.role !== 'reporter') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '600px', margin: '2rem auto' }}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 style={{ marginTop: '1rem', color: 'var(--accent-red)' }}>Reporter Access Only</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Your active profile is set to a <strong>{currentUser ? currentUser.role : 'Guest'}</strong>. Only authorized Citizen Reporters can submit stories.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onNavigation('auth')}>
          Go to Auth Gate
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '1rem auto 0 auto', animation: 'fadeIn 0.3s ease-out' }}>
      
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Citizen Reporter Story Submission</h1>
        <p style={{ color: 'var(--text-muted)' }}>Empower your local community by reporting facts. Follow standard ethical guidelines.</p>
      </div>

      {submitSuccess && (
        <div style={{ background: 'rgba(56,161,105,0.15)', border: '1px solid var(--accent-green)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '2rem', animation: 'pulseGlow 1.5s' }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <h3 style={{ color: 'var(--accent-green)', marginTop: '0.5rem' }}>Story Submitted Successfully!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Your submission has been catalogued in localStorage and sent to the Verification Queue. Redirecting you to dashboard...
          </p>
        </div>
      )}

      {/* Step Progress Indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', position: 'relative', padding: '0 1rem' }}>
        <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '2px', background: 'var(--bg-tertiary)', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '5%', right: step === 3 ? '5%' : step === 2 ? '50%' : '95%', height: '2px', background: 'var(--accent-blue)', zIndex: 1, transition: 'var(--transition-smooth)' }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step >= 1 ? 'var(--accent-blue)' : 'var(--bg-tertiary)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#ffffff' }}>1</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= 1 ? '#ffffff' : 'var(--text-dark)', marginTop: '0.5rem' }}>Narrative</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step >= 2 ? 'var(--accent-blue)' : 'var(--bg-tertiary)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#ffffff' }}>2</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= 2 ? '#ffffff' : 'var(--text-dark)', marginTop: '0.5rem' }}>Context & Citations</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step >= 3 ? 'var(--accent-blue)' : 'var(--bg-tertiary)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#ffffff' }}>3</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= 3 ? '#ffffff' : 'var(--text-dark)', marginTop: '0.5rem' }}>Evidence Media</span>
        </div>
      </div>

      {/* STEP 1: STORY NARRATIVE */}
      {step === 1 && (
        <div className="glass-card" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📝 Step 1: Document the Incident Details
          </h2>

          <div className="form-group">
            <label className="form-label">Story Headline / Title <span style={{ color: 'var(--accent-red)' }}>*</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Major Structural Fissure Widening on Highway Pier" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Make it clear, objective, and specific. Avoid clickbait.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Report Category <span style={{ color: 'var(--accent-red)' }}>*</span></label>
            <select 
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Story Narrative <span style={{ color: 'var(--accent-red)' }}>*</span></label>
            <textarea 
              className="form-textarea" 
              placeholder="Provide a comprehensive description of the event. Answer: What happened? When? Who is impacted? What is the current situation? State only observable facts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: '180px' }}
              required
            ></textarea>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Keep details highly factual. Mention specific dates, impact, or duration of the issue.</span>
          </div>

          {/* AI Pre-Audit Integrations */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🤖 AI Verification Pre-Audit
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Heuristically check sensationalism, readability, spatiotemporal specificities, and verify objectivity beforehand.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', fontSize: '0.85rem' }}
                onClick={runAiPreAudit}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? '⚡ Analyzing...' : '🤖 Run AI Check'}
              </button>
            </div>

            {isAnalyzing && (
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600, animation: 'pulseGlow 1.5s infinite' }}>Running semantic verification, clicks detection, and entity auditing...</p>
              </div>
            )}

            {aiReport && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(22, 28, 38, 0.8)', border: '1px solid var(--glass-border)', animation: 'fadeIn 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>FACTUAL INTEGRITY SCORE</span>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: 800, 
                    color: aiReport.score >= 80 ? 'var(--accent-green)' : aiReport.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)',
                    background: aiReport.score >= 80 ? 'rgba(56,161,105,0.12)' : aiReport.score >= 50 ? 'rgba(214,158,46,0.12)' : 'rgba(229,62,98,0.12)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px'
                  }}>
                    {aiReport.score}% - {aiReport.score >= 80 ? 'High Integrity' : aiReport.score >= 50 ? 'Medium Credibility' : 'Low Factual Score'}
                  </span>
                </div>

                {/* Score bar */}
                <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: `${aiReport.score}%`, 
                    height: '100%', 
                    background: aiReport.score >= 80 ? 'var(--accent-green)' : aiReport.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }}></div>
                </div>

                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginBottom: '0.5rem' }}>✨ Objective Strengths</h4>
                    {aiReport.bonuses.length > 0 ? (
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {aiReport.bonuses.map((b, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{b}</li>)}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>None detected. Try making details more descriptive or citing official references.</p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-red)', marginBottom: '0.5rem' }}>⚠️ Recommendations for Reporter</h4>
                    {aiReport.deductions.length > 0 ? (
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {aiReport.deductions.map((d, i) => <li key={i} style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }}>{d}</li>)}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontStyle: 'italic' }}>Narrative successfully meets citizen journalism neutrality protocols!</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={nextStep}>
              Next: Context & Citations &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTEXT & CITATIONS */}
      {step === 2 && (
        <div className="glass-card" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📍 Step 2: Location Tagging & Source Citations
          </h2>

          <div className="form-group">
            <label className="form-label">Geographic Location / Landmark <span style={{ color: 'var(--accent-red)' }}>*</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Outer Ring Road, Ward 12 Intersection (Opposite Metro Pillar 40)" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Specify landmarks, intersecting streets, or ward numbers for field moderation lookup.</span>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <label className="form-label">Add Supporting Citations or References</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Submitting official documents, municipal notices, WhatsApp group complaints, or local authority notices significantly accelerates the verification process.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Municipal Work Order Ref #19842" 
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddSource}>
                + Add Source
              </button>
            </div>

            {sourcesList.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {sourcesList.map((ref, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '0.25rem 0.65rem', borderRadius: '4px' }}>
                    📖 {ref}
                    <button type="button" onClick={() => handleRemoveSource(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
            <button className="btn btn-secondary" onClick={prevStep}>
              &larr; Back
            </button>
            <button className="btn btn-primary" onClick={nextStep}>
              Next: Evidence Media &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE MEDIA */}
      {step === 3 && (
        <div className="glass-card" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📸 Step 3: Attach Verified Evidence Media
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Authentic photo/video evidence is critical for fact-checking. To simulate an upload, choose one or more of our highly realistic preloaded media cards that match your report topic.
          </p>

          <div className="grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
            {MOCK_MEDIA_LIBRARY.map((med, idx) => {
              const isSelected = selectedMedia.some(m => m.url === med.url);
              return (
                <div 
                  key={idx}
                  onClick={() => handleToggleMedia(med)}
                  style={{
                    border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                    transition: 'var(--transition-snappy)',
                    boxShadow: isSelected ? '0 0 10px rgba(49, 130, 206, 0.4)' : ''
                  }}
                >
                  <img src={med.url} alt={med.caption} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: isSelected ? '#ffffff' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {isSelected ? '✅ Selected' : '📁 Click to attach'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={prevStep}>
              &larr; Back
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)' }}
                onClick={() => handleSubmitStory('draft')}
              >
                💾 Save as Draft
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleSubmitStory('pending')}
              >
                🚀 Submit to Verification Queue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
