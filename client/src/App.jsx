import React, { useState } from 'react';
import Header from './components/Header';
import ClaimInput from './components/ClaimInput';
import ImageUpload from './components/ImageUpload';
import ResultCard from './components/ResultCard';
import LoadingSpinner from './components/LoadingSpinner';
import styles from './App.module.css';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image'
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasImage, setHasImage] = useState(false);

  const handleVerify = async (payload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const isFormData = payload instanceof FormData;
    setHasImage(isFormData);

    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        body: isFormData
          ? payload
          : JSON.stringify(payload),
        headers: isFormData
          ? {}
          : { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setResult(data);

      // Scroll to result
      setTimeout(() => {
        document.getElementById('result-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      setError(err.message || 'Something went wrong. Please check that the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.app}>
      <Header />

      <main className={styles.main}>
        {/* Input section — hidden while showing results */}
        {!result && !isLoading && (
          <section className={`${styles.inputSection} animate-fade-up`} aria-label="Claim verification input">
            <div className={styles.tabGroup}>
              <button
                id="tab-text"
                className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                Type a Claim
              </button>
              <button
                id="tab-image"
                className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                onClick={() => setActiveTab('image')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                Upload Screenshot
              </button>
            </div>

            <div className={styles.inputPanel}>
              {activeTab === 'text' ? (
                <ClaimInput onVerify={handleVerify} isLoading={isLoading} />
              ) : (
                <ImageUpload onVerify={handleVerify} isLoading={isLoading} />
              )}
            </div>

            {error && (
              <div className={styles.errorBox} role="alert">
                <div className={styles.errorTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5e7d" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Error
                </div>
                <p className={styles.errorText}>{error}</p>
                <div className={styles.errorHint}>
                  💡 Make sure the backend server is running: <code>node server/index.js</code>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Loading state */}
        {isLoading && (
          <section className={styles.loadingSection} aria-live="polite">
            <LoadingSpinner hasImage={hasImage} />
          </section>
        )}

        {/* Results */}
        {result && !isLoading && (
          <section className={styles.resultSection} aria-label="Fact-check results">
            <ResultCard result={result} onReset={handleReset} />
          </section>
        )}

        {/* How it works — shown when no result */}
        {!result && !isLoading && (
          <section className={styles.howItWorks}>
            <h2 className={styles.howTitle}>How Med-Verify Works</h2>
            <div className={styles.howSteps}>
              {[
                {
                  step: '01',
                  icon: '📸',
                  title: 'Input Your Claim',
                  desc: 'Type a medical claim or upload a screenshot of a social media post with health advice.'
                },
                {
                  step: '02',
                  icon: '👁',
                  title: 'OCR Extraction',
                  desc: 'Mistral OCR reads and extracts all text from your image with high accuracy.'
                },
                {
                  step: '03',
                  icon: '📊',
                  title: 'Cross-Reference',
                  desc: 'The claim is matched against WHO Global Health Observatory data and ODPHP evidence-based guidelines.'
                },
                {
                  step: '04',
                  icon: '🧠',
                  title: 'AI Verdict',
                  desc: 'Gemini 2.0 Flash synthesizes all evidence to deliver a structured, sourced fact-check verdict.'
                }
              ].map((item, i) => (
                <div key={i} className={styles.howStep} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={styles.howStepNum}>{item.step}</div>
                  <div className={styles.howStepIcon}>{item.icon}</div>
                  <h3 className={styles.howStepTitle}>{item.title}</h3>
                  <p className={styles.howStepDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Med-Verify uses{' '}
          <a href="https://www.who.int/data/gho" target="_blank" rel="noopener noreferrer">WHO GHO</a>,{' '}
          <a href="https://odphp.health.gov/myhealthfinder" target="_blank" rel="noopener noreferrer">MyHealthfinder</a>,{' '}
          <a href="https://mistral.ai" target="_blank" rel="noopener noreferrer">Mistral OCR</a>,{' '}
          and <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noopener noreferrer">Google Gemini</a> for educational purposes only.
        </p>
      </footer>
    </div>
  );
}
