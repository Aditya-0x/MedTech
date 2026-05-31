import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ClaimInput from './components/ClaimInput';
import ImageUpload from './components/ImageUpload';
import ResultCard from './components/ResultCard';
import LoadingSpinner from './components/LoadingSpinner';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import GenericFinder from './components/GenericFinder';
import Footer from './components/Footer';

const API_BASE = '/api';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medverify_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
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

  // Authentication and view states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('verify'); // 'verify' | 'history' | 'generic'
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
        localStorage.removeItem('medverify_user');
        localStorage.removeItem('medverify_token');
        setCurrentView('verify');
      }
    } else {
      setCurrentView('verify');
    }

    if (promptLogin === 'true' || (viewParam === 'history' && !isUserLoggedIn)) {
      setIsLoginModalOpen(true);
      const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else if (viewParam) {
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
        if (data.report) setResult(data.report);
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
        body: isFormData ? payload : JSON.stringify(payload),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setResult(data);

      if (token) {
        await autoSaveReport(data, token);
      }

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

  // Setup intersection observer for scroll animations
  useEffect(() => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-8');
                entry.target.classList.add('opacity-100', 'translate-y-0');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-element').forEach((el) => {
        observer.observe(el);
    });

    return () => observer.disconnect();
  }, [currentView, result]);


  return (
    <div className="font-body bg-background text-on-background min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden">
      {/* Global Animated Mesh Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="mesh-blob bg-primary/30 dark:bg-primary/20 w-[600px] h-[600px] rounded-full top-[-10%] left-[-10%] animate-float-sexy" style={{ animationDelay: '0s' }}></div>
        <div className="mesh-blob bg-tertiary/25 dark:bg-tertiary/20 w-[800px] h-[800px] rounded-full bottom-[-20%] right-[-10%] animate-sexy-pulse" style={{ animationDelay: '-5s' }}></div>
        <div className="mesh-blob bg-secondary/25 dark:bg-secondary/20 w-[500px] h-[500px] rounded-full top-[40%] left-[30%] animate-float-sexy" style={{ animationDelay: '-10s' }}></div>
      </div>

      {/* Main app content with elevated z-index */}
      <div className="relative z-10 flex flex-col flex-grow">
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

      <main className="flex-grow pt-20 flex flex-col items-center">
        {currentView === 'history' && token && (
          <Dashboard 
            userToken={token}
            onSelectReport={handleSelectReport}
            onNavigateToVerify={handleNavigateToVerify}
          />
        )}

        {currentView === 'generic' && (
          <GenericFinder theme={theme} />
        )}

        {currentView === 'verify' && (
          <>
            {/* Landing / Hero view (hidden when verifying or showing results) */}
            {!result && !isLoading && (
              <>
                <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
                  {/* Atmospheric background elements */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl mix-blend-multiply opacity-50"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary-container/30 rounded-full blur-3xl mix-blend-multiply opacity-50"></div>
                  </div>
                  
                  <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in-up">
                    <h1 className="font-headline text-6xl md:text-8xl font-normal leading-[1.1] tracking-tight mb-6 drop-shadow-sm animate-fade-in-up text-on-surface text-center">
                        <span className="text-gradient-primary inline-block" style={{ backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}>Truth in Medicine,</span><br />
                        <span className="italic text-primary inline-block mt-2" style={{ textShadow: '0 0 20px rgba(194,101,42,0.4)' }}>Beautifully Verified.</span>
                    </h1>
                    <p className="font-body text-xl md:text-2xl text-on-surface-variant mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                        Cut through the noise. Paste any medical claim below to instantly check its validity against the world's most authoritative healthcare databases.
                    </p>

                    {/* Quirky Verification Input Container */}
                    <div className="max-w-3xl mx-auto relative group animate-float-sexy">
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary/40 via-tertiary/40 to-primary/40 rounded-xl blur-lg opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-300 animate-shimmer" style={{ backgroundSize: '200% auto' }}></div>
                        <div className="relative bg-surface rounded-xl flex flex-col shadow-float hand-drawn-border p-2 transform transition-transform group-hover:scale-[1.01]">
                           
                           {/* Tabs */}
                           <div className="flex gap-4 p-2 border-b border-outline-variant/30 mb-2">
                               <button 
                                 onClick={() => setActiveTab('text')}
                                 className={`px-4 py-1 font-body text-sm rounded-full transition-colors ${activeTab === 'text' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
                               >
                                 Type a Claim
                               </button>
                               <button 
                                 onClick={() => setActiveTab('image')}
                                 className={`px-4 py-1 font-body text-sm rounded-full transition-colors ${activeTab === 'image' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
                               >
                                 Upload Screenshot
                               </button>
                           </div>
                           
                           {/* Input forms */}
                           {activeTab === 'text' ? (
                             <ClaimInput onVerify={handleVerify} isLoading={isLoading} />
                           ) : (
                             <ImageUpload onVerify={handleVerify} isLoading={isLoading} />
                           )}
                           
                        </div>
                    </div>

                    {error && (
                      <div className="mt-6 bg-error-container text-on-error-container px-6 py-4 rounded-xl max-w-2xl mx-auto text-left border border-error/20 flex items-start gap-4">
                        <span className="material-symbols-outlined text-error mt-0.5">error</span>
                        <div>
                          <p className="font-bold">{error}</p>
                          <p className="text-sm mt-1 opacity-80">💡 Make sure the backend server is running: `node server/index.js`</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex items-center justify-center gap-2 text-sm text-on-surface-variant font-body">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">security</span>
                        Bank-level encryption. Your queries are private.
                    </div>
                  </div>
                </section>

                {/* Authoritative Sources */}
                <section className="w-full py-24 bg-surface-container-low border-y border-outline-variant/30">
                    <div className="max-w-6xl mx-auto px-6 text-center">
                        <h2 className="font-headline text-2xl text-on-surface-variant mb-12 uppercase tracking-widest">Anchored in Authority</h2>
                        <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            
                            <div className="flex items-center gap-4 group scroll-element transition-all duration-700 ease-out opacity-0 translate-y-8">
                                <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                    <span className="material-symbols-outlined text-3xl">public</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-headline font-bold text-xl text-on-surface">WHO</div>
                                    <div className="text-xs text-on-surface-variant tracking-wider uppercase">Data Partner</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 group scroll-element transition-all duration-700 delay-100 ease-out opacity-0 translate-y-8">
                                <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                    <span className="material-symbols-outlined text-3xl">health_and_safety</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-headline font-bold text-xl text-on-surface">CDC</div>
                                    <div className="text-xs text-on-surface-variant tracking-wider uppercase">Reference Database</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 group scroll-element transition-all duration-700 delay-200 ease-out opacity-0 translate-y-8">
                                <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                    <span className="material-symbols-outlined text-3xl">local_library</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-headline font-bold text-xl text-on-surface">PubMed</div>
                                    <div className="text-xs text-on-surface-variant tracking-wider uppercase">Clinical Trials</div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </section>

                {/* Bento Grid Feature Section */}
                <section className="w-full py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 scroll-element opacity-0 translate-y-8 transition-all duration-700">
                            <h2 className="font-headline text-4xl md:text-5xl text-on-surface mb-4">Clarity in an age of confusion.</h2>
                            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto">Our methodology is transparent, rigorous, and designed to surface the truth.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                            {/* Bento Box 1 */}
                            <div className="md:col-span-2 bg-surface-container-low rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden shadow-soft border border-outline-variant/20 hover:border-primary/40 hover:shadow-float hover:-translate-y-1 transition-all duration-300 group scroll-element opacity-0 translate-y-8 delay-100">
                                <div className="absolute top-0 right-0 p-8 transform transition-transform group-hover:scale-110 group-hover:rotate-12">
                                    <span className="material-symbols-outlined text-5xl text-primary/20 group-hover:text-primary/60 transition-colors group-hover:animate-sexy-pulse">psychology</span>
                                </div>
                                <h3 className="font-headline text-3xl text-on-surface mb-2 group-hover:text-primary transition-colors">Contextual AI Analysis</h3>
                                <p className="font-body text-on-surface-variant max-w-md">We don't just keyword match. Our models understand nuance, severity, and medical context before cross-referencing literature.</p>
                            </div>
                            
                            {/* Bento Box 2 */}
                            <div className="bg-surface-container-highest rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden shadow-soft border border-outline-variant/20 hover:border-primary/30 transition-colors group scroll-element opacity-0 translate-y-8 transition-all duration-700 delay-200">
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="material-symbols-outlined text-5xl text-tertiary/20 group-hover:text-tertiary/40 transition-colors">speed</span>
                                </div>
                                <h3 className="font-headline text-2xl text-on-surface mb-2">Real-time Updates</h3>
                                <p className="font-body text-on-surface-variant">Medical consensus evolves. So do our verdicts.</p>
                            </div>
                            
                            {/* Bento Box 3 */}
                            <div className="bg-primary-container/10 rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden shadow-soft border border-primary/20 hover:border-primary/40 transition-colors group scroll-element opacity-0 translate-y-8 transition-all duration-700 delay-100">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="material-symbols-outlined text-5xl text-primary/40">verified_user</span>
                                </div>
                                <h3 className="font-headline text-2xl text-on-surface mb-2">Immutable Audit Trail</h3>
                                <p className="font-body text-on-surface-variant">Every fact-check is archived with cryptographic proof of the sources referenced.</p>
                            </div>
                            
                            {/* Bento Box 4 */}
                            <div className="md:col-span-2 bg-surface-container-low rounded-3xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-soft border border-outline-variant/20 hover:border-primary/40 group scroll-element opacity-0 translate-y-8 transition-all duration-700 delay-200 hover:scale-[1.02] hover:shadow-float">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" style={{ backgroundSize: '200% auto' }}></div>
                                <div className="w-full max-w-md h-48 bg-surface rounded-xl shadow-inner flex items-center justify-center p-6 hand-drawn-border mb-6 group-hover:animate-sexy-pulse">
                                    <div className="flex items-start gap-4 transform transition-transform group-hover:scale-105">
                                        <span className="material-symbols-outlined text-error text-3xl animate-heartbeat">cancel</span>
                                        <div className="text-left">
                                            <div className="font-headline text-xl text-on-surface line-through decoration-error decoration-2 group-hover:text-error transition-colors">"Vitamin C cures the common cold instantly."</div>
                                            <div className="font-body text-sm text-on-surface-variant mt-2 bg-error-container text-on-error-container px-3 py-1 rounded-full inline-block shadow-sm">Misleading - No Clinical Evidence</div>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="font-headline text-2xl text-on-surface mb-2 relative z-10 group-hover:text-primary transition-colors">See the proof, beautifully presented.</h3>
                            </div>
                        </div>
                    </div>
                </section>
              </>
            )}

            {/* Loading state */}
            {isLoading && (
              <section className="w-full max-w-5xl flex flex-col items-center justify-center py-32 min-h-[60vh]">
                <LoadingSpinner hasImage={hasImage} />
              </section>
            )}

            {/* Results */}
            {result && !isLoading && (
              <section className="w-full">
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

      {!isLoading && <Footer />}

      </div> {/* End of z-10 container */}

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
