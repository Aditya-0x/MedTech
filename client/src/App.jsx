import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ClaimInput from './components/ClaimInput';
import ImageUpload from './components/ImageUpload';
import ResultCard from './components/ResultCard';
import LoadingSpinner from './components/LoadingSpinner';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import styles from './App.module.css';

const API_BASE = '/api';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medverify_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medverify_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image'
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasImage, setHasImage] = useState(false);

  const [showPreloader, setShowPreloader] = useState(true);

  // Welcome Preloader screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Authentication and view states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('verify'); // 'verify' | 'history'
  const [isSaved, setIsSaved] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const promptLogin = params.get('promptLogin');

    const savedUser = localStorage.getItem('medverify_user');
    const savedToken = localStorage.getItem('medverify_token');
    
    let isUserLoggedIn = false;

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        isUserLoggedIn = true;
        
        if (viewParam === 'history') {
          setCurrentView('history');
        } else {
          setCurrentView('verify');
        }
        
        // Fetch latest profile & points
        fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('medverify_user', JSON.stringify(data.user));
          }
        })
        .catch(err => console.error('Failed to sync profile:', err));
        
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('medverify_user');
        localStorage.removeItem('medverify_token');
        setCurrentView('verify');
      }
    } else {
      setCurrentView('verify');
    }

    if (promptLogin === 'true' || (viewParam === 'history' && !isUserLoggedIn)) {
      setIsLoginModalOpen(true);
      // Clean up URL parameters to keep it clean
      const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else if (viewParam) {
      // Clean up URL parameters after loading the view
      const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, []);

  const handleLoginSuccess = async (userData, sessionToken) => {
    setUser(userData);
    setToken(sessionToken);
    localStorage.setItem('medverify_user', JSON.stringify(userData));
    localStorage.setItem('medverify_token', sessionToken);
    setIsLoginModalOpen(false);
    
    // Auto-save guest research after successful login
    if (result && !isSaved) {
      await autoSaveReport(result, sessionToken);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setResult(null);
    setIsSaved(false);
    localStorage.removeItem('medverify_user');
    localStorage.removeItem('medverify_token');
    setCurrentView('verify');
  };

  const autoSaveReport = async (reportData, sessionToken) => {
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ report: reportData })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSaved(true);
        if (data.report) {
          // Update the local result state to include the enriched id/savedAt
          setResult(data.report);
        }
        if (data.newTotalPoints !== undefined) {
          setUser(prev => {
            const updatedUser = { ...prev, points: data.newTotalPoints };
            localStorage.setItem('medverify_user', JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      }
    } catch (err) {
      console.error('Failed to auto-save report to history:', err);
    }
  };

  const handleSave = async () => {
    if (!token || !result || isSaved) return;
    await autoSaveReport(result, token);
  };

  const handleVerify = async (payload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setIsSaved(false);

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

      // Auto-save search to sandbox if user is logged in
      if (token) {
        await autoSaveReport(data, token);
      }

      // Scroll to top for loading and results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);

    } catch (err) {
      setError(err.message || 'Something went wrong. Please check that the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsSaved(false);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectReport = (report) => {
    setResult(report);
    setIsSaved(true);
    setCurrentView('verify');

    // Scroll to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleNavigateToVerify = () => {
    setResult(null);
    setIsSaved(false);
    setCurrentView('verify');
  };

  const handleViewChange = (view) => {
    if (view === 'about') {
      window.location.href = '/about.html';
    } else if (view === 'contact') {
      window.location.href = '/contact.html';
    } else {
      setCurrentView(view);
    }
  };



  return (
    <div className={styles.app}>
      {showPreloader && (
        <div className={styles.preloader} aria-hidden="true">
          <div className={styles.preloaderLogo}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="6" width="10" height="28" rx="3" fill="url(#preloadGrad)"/>
              <rect x="6" y="15" width="28" height="10" rx="3" fill="url(#preloadGrad)"/>
              <circle cx="28" cy="28" r="10" fill="#07060f"/>
              <circle cx="28" cy="28" r="9" fill="url(#preloadGrad2)"/>
              <path d="M24 28.5l2.5 2.5 5-5" stroke="#07060f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="preloadGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00e5cc"/>
                  <stop offset="1" stopColor="#b388ff"/>
                </linearGradient>
                <linearGradient id="preloadGrad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00e5cc"/>
                  <stop offset="1" stopColor="#5df5c0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.preloaderTitle}>Med-Verify <span className={styles.proBadge}>PRO</span></h1>
          <p className={styles.preloaderText}>Securing Clinical Synthesis Tunnel...</p>
        </div>
      )}
      <Header 
        user={user}
        activeView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        showHero={currentView === 'verify' && !result && !isLoading}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignInClick={() => setIsLoginModalOpen(true)}
      />

      <main className={
        currentView === 'verify' && isLoading 
          ? styles.mainLoading 
          : currentView === 'verify' && !result 
            ? `${styles.main} ${styles.mainLanding}` 
            : styles.main
      }>
        {currentView === 'history' && token && (
          <Dashboard 
            userToken={token}
            onSelectReport={handleSelectReport}
            onNavigateToVerify={handleNavigateToVerify}
          />
        )}

        {currentView === 'verify' && (
          <>
            {/* Input & Hero split grid section — hidden while showing results */}
            {!result && !isLoading && (
              <div className={`${styles.landingGrid} animate-fade-up`}>
                {/* Left Column: Hero Content */}
                <div className={styles.heroColumn}>
                  <div className={styles.heroTag}>🔬 AI-Powered Medical Verification</div>
                  <h1 className={styles.heroTitle}>
                    Fight Medical<br/>
                    <span className={styles.heroGradient}>Misinformation</span>
                  </h1>
                  <p className={styles.heroDesc}>
                    Verify health claims from social media against authoritative WHO data, 
                    evidence-based guidelines from the US Department of Health, and 
                    cutting-edge AI reasoning — in seconds.
                  </p>
                  <div className={styles.heroStats}>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>WHO</span>
                      <span className={styles.statLabel}>Global Health Data</span>
                    </div>
                    <div className={styles.statDivider}/>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>ODPHP</span>
                      <span className={styles.statLabel}>Evidence-Based Guidelines</span>
                    </div>
                    <div className={styles.statDivider}/>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>Gemini</span>
                      <span className={styles.statLabel}>AI Reasoning</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Search Input Panel */}
                <div className={styles.searchColumn}>
                  <section className={styles.inputSection} aria-label="Claim verification input">
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
                </div>
              </div>
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
                <ResultCard 
                  result={result} 
                  onReset={handleReset} 
                  isAuthenticated={!!user}
                  isSaved={isSaved}
                  onSave={handleSave}
                  onSignInRequired={() => setIsLoginModalOpen(true)}
                />
              </section>
            )}


          </>
        )}
      </main>

      {!isLoading && (
        <>
          <footer className={styles.footer}>
            <div className={styles.footerContainer}>
              <p className={styles.footerText}>
                © 2026 Med-Verify Systems, Inc. All rights reserved. 
                Synthesizing secure, authoritative clinical data from{' '}
                <a href="https://www.who.int/data/gho" target="_blank" rel="noopener noreferrer">WHO GHO</a>,{' '}
                <a href="https://odphp.health.gov/myhealthfinder" target="_blank" rel="noopener noreferrer">MyHealthfinder</a>,{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer">PubMed</a>,{' '}
                <a href="https://clinicaltrials.gov/" target="_blank" rel="noopener noreferrer">ClinicalTrials.gov</a>,{' '}
                and <a href="https://open.fda.gov/" target="_blank" rel="noopener noreferrer">OpenFDA</a>. 
                All clinical verification pipelines are compliant under Ayushman Bharat Digital Mission (ABDM) and HIPAA guidelines.
              </p>
              <div className={styles.footerSection}>
                <strong>Platform</strong>
                <a href="/" style={{ color: 'var(--md-primary)' }}>Verify Claim</a>
                <span className={styles.footerDivider}>•</span>
                <a href="/about.html">About Creator</a>
                <span className={styles.footerDivider}>•</span>
                <a href="/contact.html">Contact Support</a>
              </div>
            </div>
          </footer>
        </>
      )}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
