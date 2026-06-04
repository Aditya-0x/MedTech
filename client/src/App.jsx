import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ClaimInput from './components/ClaimInput';
import ImageUpload from './components/ImageUpload';
import ResultCard from './components/ResultCard';
import LoadingSpinner from './components/LoadingSpinner';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import GenericFinder from './components/GenericFinder';
import Contact from './components/Contact';
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

  const navigate = useNavigate();
  const location = useLocation();

  // Authentication and view states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
      }
    }

    if (promptLogin === 'true' || (location.pathname === '/history' && !isUserLoggedIn)) {
      setIsLoginModalOpen(true);
      const newUrl = window.location.pathname;
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
    navigate('/');
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
    navigate('/');

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleNavigateToVerify = () => {
    setResult(null);
    setIsSaved(false);
    navigate('/');
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
  }, [location.pathname, result]);


  return (
    <div className="font-body bg-background text-on-background min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden">
      {/* Main app content with elevated z-index */}
      <div className="relative z-10 flex flex-col flex-grow">
      <Header 
        user={user}
        onLogout={handleLogout}
        showHero={location.pathname === '/' && !result && !isLoading}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignInClick={() => setIsLoginModalOpen(true)}
      />

      <main className="flex-grow pt-20 flex flex-col items-center">
        <Routes>
          <Route path="/history" element={
            token ? (
              <Dashboard 
                userToken={token}
                onSelectReport={handleSelectReport}
                onNavigateToVerify={handleNavigateToVerify}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center font-body text-xl min-h-[50vh]">
                 <span className="material-symbols-outlined text-6xl text-primary mb-4">lock</span>
                 Please sign in to view your archive.
              </div>
            )
          } />
          
          
          <Route path="/trumeds" element={<GenericFinder theme={theme} />} />
          <Route path="/contact" element={<Contact user={user} />} />
          
          <Route path="/" element={
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
                    <p className="font-body text-xl md:text-2xl text-on-surface-variant mb-16 max-w-2xl mx-auto font-light leading-relaxed">
                        Cut through the noise. Paste any medical claim below to instantly check its validity against the world's most authoritative healthcare databases.
                    </p>

                    {/* Verification Input Container */}
                    <div className="w-full max-w-4xl mx-auto relative group">
                        <div className="relative bg-surface-container-lowest rounded-3xl flex flex-col border border-outline/10 p-4 md:p-6 transform transition-transform shadow-sm hover:shadow-md">
                           
                           {/* Tabs */}
                           <div className="flex gap-6 px-2 md:px-4 py-2 border-b border-outline-variant/30 mb-4">
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

                  </div>
                </section>

              </>
            )}

              {/* Main Content Areas */}
              {(result || isLoading) && (
                <div className="w-full max-w-4xl mx-auto px-6 py-16 flex flex-col items-center min-h-[50vh]">
                  
                  {/* Result View */}
                  {result && (
                    <div className="w-full animate-fade-in-up">
                      <ResultCard 
                        result={result} 
                        onReset={handleReset} 
                        onSave={handleSave} 
                        isSaved={isSaved} 
                        isSaving={false}
                        isLoggedIn={!!token}
                        onLoginPrompt={() => setIsLoginModalOpen(true)}
                      />
                    </div>
                  )}
                  
                  {/* Loading View */}
                  {isLoading && (
                    <div className="w-full py-12">
                       <LoadingSpinner hasImage={hasImage} />
                    </div>
                  )}
                </div>
              )}
            </>
          } />
        </Routes>
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
