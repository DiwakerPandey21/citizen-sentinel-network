import { useState } from 'react';
import { LITERACY_QUIZ } from '../db/initialData';

export default function MediaLiteracy() {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const activeQuestion = LITERACY_QUIZ[currentQIndex];

  const handleOptionClick = (optionIdx) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    if (optionIdx === activeQuestion.answer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentQIndex < LITERACY_QUIZ.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const getRank = (finalScore) => {
    const total = LITERACY_QUIZ.length;
    const ratio = finalScore / total;
    if (ratio === 1) return { title: '👑 Fact-Checking Scholar', color: 'var(--accent-green)', desc: 'Flawless score! You have master-level fact-checking reflexes and excel at recognizing media indicators.' };
    if (ratio >= 0.7) return { title: '🔍 Sharp Eye Fact-Checker', color: 'var(--accent-blue)', desc: 'Great job! You recognize common sensationalist markers and check for official source citations.' };
    return { title: '🌱 Media Apprentice', color: 'var(--accent-amber)', desc: 'You are off to a solid start. Keeping read lists checked and auditing image metadata will sharpen your reflexes!' };
  };

  const activeRank = getRank(score);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Educational Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Media Literacy & Fact-Checking Hub</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
          Combatting fake news requires active citizen vigilance. Learn verification standards and test your credentials using our interactive simulation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', marginBottom: '4rem' }}>
        
        {/* Core Media Principles */}
        <div className="glass-card" style={{ height: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📖 Journalism Verification Standards
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
            <div style={{ borderLeft: '3px solid var(--accent-blue)', paddingLeft: '1rem' }}>
              <strong style={{ color: '#ffffff' }}>Press Information Bureau (PIB) Guidelines</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Verify if reports are circulating with official press releases. Identify alerts issued via central PIB fact-check handles. Reject unsourced claims regarding regulatory timelines.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '1rem' }}>
              <strong style={{ color: '#ffffff' }}>IFCN Non-Partisanship Rules</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Fact-checkers must apply the exact same evaluation standards to all claims regardless of source or political leanings. Always transparently list source citations so readers can replicate the audit.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--accent-amber)', paddingLeft: '1rem' }}>
              <strong style={{ color: '#ffffff' }}>UNESCO Ethical Reporting Codes</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Ensure stories respect public safety and avoid creating mass panic. Verify high-voltage, emergency, or chemical spill claims with local engineering and health boards prior to publication.
              </p>
            </div>
          </div>
        </div>

        {/* Fact-Checking Cheat Sheet */}
        <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 Quick Verification Audit Cheat Sheet
          </h2>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-muted)', flexGrow: 1 }}>
            <li>
              <strong>Reverse Image Lookup:</strong> Copy-paste visual thumbnails into Google Lens/TinEye to confirm the photo isn't from a historical crisis in another city.
            </li>
            <li>
              <strong>Examine URLs & Domain Spelling:</strong> Fake news often uses spoofed web addresses designed to look like famous portals (e.g. `bbc-news-reports.co` instead of standard outlets).
            </li>
            <li>
              <strong>Audit Adjectives:</strong> Verifiable facts contain numbers, dates, official names, and visual blueprints. Sensationalist clickbait uses excessive exclamation marks, capitalization, and emotional prompts.
            </li>
            <li>
              <strong>Cui Bono (Who Benefits?):</strong> Check if the story prompts readers to buy specific items, panic-purchase groceries, or share out of fear.
            </li>
          </ul>
        </div>

      </div>

      {/* TRUSTED FACT-CHECKING RESOURCE DIRECTORY */}
      <div style={{ marginBottom: '4rem', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
          🛡️ Trusted Fact-Checking Resource Directory
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          Access verified global registries, national truth check handles, and international digital education portals directly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          
          {/* PIB Card */}
          <a 
            href="https://www.pib.gov.in/indexd.aspx?reg=3&lang=1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-card interactive-hover-blue"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              textDecoration: 'none', 
              color: 'inherit',
              border: '1px solid rgba(49, 130, 206, 0.25)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              padding: '1.5rem',
              transition: 'var(--transition-snappy)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🇮🇳</span>
              <span style={{ 
                background: 'rgba(49, 130, 206, 0.1)', 
                border: '1px solid var(--accent-blue)', 
                color: 'var(--accent-blue)', 
                fontSize: '0.65rem', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px',
                fontWeight: 700 
              }}>
                GOVT ADVISORIES
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
              PIB Fact Check India
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>↗</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', flexGrow: 1, margin: 0 }}>
              Official press debunk desk operated by the Government of India. Audit rumors regarding central ministries, schemes, regulations, and public circulars.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              Verify National Advisories &rarr;
            </div>
          </a>

          {/* Poynter IFCN Card */}
          <a 
            href="https://www.poynter.org/ifcn/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-card interactive-hover-blue"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              textDecoration: 'none', 
              color: 'inherit',
              border: '1px solid rgba(56, 161, 105, 0.25)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              padding: '1.5rem',
              transition: 'var(--transition-snappy)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>⚖️</span>
              <span style={{ 
                background: 'rgba(56, 161, 105, 0.1)', 
                border: '1px solid var(--accent-green)', 
                color: 'var(--accent-green)', 
                fontSize: '0.65rem', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px',
                fontWeight: 700 
              }}>
                GLOBAL STANDARD
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
              Poynter IFCN Registry
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>↗</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', flexGrow: 1, margin: 0 }}>
              The International Fact-Checking Network registry. Search debunks from certified third-party fact checkers (Snopes, FactCheck, PolitiFact) worldwide.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              Explore IFCN Registry &rarr;
            </div>
          </a>

          {/* UNESCO Card */}
          <a 
            href="https://www.unesco.org/en/media-information-literacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-card interactive-hover-blue"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              textDecoration: 'none', 
              color: 'inherit',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              padding: '1.5rem',
              transition: 'var(--transition-snappy)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🌐</span>
              <span style={{ 
                background: 'rgba(217, 119, 6, 0.1)', 
                border: '1px solid var(--accent-amber)', 
                color: 'var(--accent-amber)', 
                fontSize: '0.65rem', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px',
                fontWeight: 700 
              }}>
                EDUCATION FRAME
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
              UNESCO Media Literacy
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>↗</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', flexGrow: 1, margin: 0 }}>
              Global competence training designed to empower children and adults to navigate digital information ecosystems, recognize disinformation, and think critically.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              Browse Digital Curriculum &rarr;
            </div>
          </a>

        </div>
      </div>

      {/* QUIZ PORTAL BOX */}
      <div className="quiz-slider-shell" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {!quizFinished ? (
          <div>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-blue)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                ⚡ SPOT THE FAKE NEWS CHALLENGE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Question {currentQIndex + 1} of {LITERACY_QUIZ.length}
              </span>
            </div>

            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', lineHeight: '1.4', color: '#ffffff' }}>
              {activeQuestion.question}
            </h3>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activeQuestion.options.map((opt, idx) => {
                let statusClass = '';
                if (isAnswered) {
                  if (idx === activeQuestion.answer) {
                    statusClass = 'correct';
                  } else if (idx === selectedOption) {
                    statusClass = 'wrong';
                  }
                }

                return (
                  <button 
                    key={idx}
                    className={`quiz-option-btn ${statusClass}`}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isAnswered}
                    style={{
                      cursor: isAnswered ? 'not-allowed' : 'pointer',
                      opacity: isAnswered && idx !== activeQuestion.answer && idx !== selectedOption ? 0.4 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{opt}</span>
                      {isAnswered && idx === activeQuestion.answer && <span>✅ Correct</span>}
                      {isAnswered && idx === selectedOption && idx !== activeQuestion.answer && <span>❌ Wrong</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fact explanation box */}
            {isAnswered && (
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', margin: '1.5rem 0', animation: 'fadeIn 0.25s' }}>
                <strong style={{ fontSize: '0.9rem', color: selectedOption === activeQuestion.answer ? 'var(--accent-green)' : 'var(--accent-red)', display: 'block', marginBottom: '0.25rem' }}>
                  {selectedOption === activeQuestion.answer ? '🎯 Spot on!' : '🔍 Keep Learning!'}
                </strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {activeQuestion.explanation}
                </p>
              </div>
            )}

            {isAnswered && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handleNextQuestion}>
                  {currentQIndex === LITERACY_QUIZ.length - 1 ? 'Finish Quiz' : 'Next Question &rarr;'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Quiz Score Display */
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.35s ease-out' }}>
            <span style={{ fontSize: '4rem' }}>🏆</span>
            
            <h2 style={{ fontSize: '1.75rem', marginTop: '1rem' }}>Challenge Completed!</h2>
            <div style={{ margin: '1.5rem 0' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Your Verification Score:</span>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: activeRank.color, margin: '0.25rem 0' }}>
                {score} / {LITERACY_QUIZ.length}
              </div>
              <span className="status-tag" style={{ background: 'var(--bg-tertiary)', color: activeRank.color, border: `1px solid ${activeRank.color}`, padding: '0.35rem 1rem' }}>
                {activeRank.title}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
              {activeRank.desc}
            </p>

            <button className="btn btn-primary" onClick={handleResetQuiz} style={{ minWidth: '160px' }}>
              🔄 Retake Quiz
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
