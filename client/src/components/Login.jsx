import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins safely
gsap.registerPlugin(ScrollTrigger);

export default function Login({ onLoginSuccess, theme, onToggleTheme }) {
  const containerRef = useRef(null);
  const scrollSectionRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // 1. Initialize GSAP ScrollTrigger for horizontal scroll mechanics
  useEffect(() => {
    const container = containerRef.current;
    const scrollSection = scrollSectionRef.current;

    if (!container || !scrollSection) return;

    // Calculate maximum horizontal travel distance
    const totalScrollWidth = scrollSection.offsetWidth - window.innerWidth;

    let pinTrigger;

    // Timeout ensures DOM layout is fully computed before mapping trigger boundaries
    const initScrollTrigger = () => {
      pinTrigger = ScrollTrigger.create({
        trigger: container,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${scrollSection.offsetWidth}`,
        onUpdate: (self) => {
          // Translate the slider element horizontally based on scroll progress
          gsap.set(scrollSection, { x: -self.progress * totalScrollWidth });
        },
        invalidateOnRefresh: true,
      });

      // Micro-animations for typography reveal on load
      gsap.fromTo(
        `.revealText`,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );
    };

    const timer = setTimeout(initScrollTrigger, 100);

    // Strict cleanup to release viewport lock on route unmount
    return () => {
      clearTimeout(timer);
      if (pinTrigger) pinTrigger.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // 2. Initialize Google Sign-in API GSI
  useEffect(() => {
    const clientIdEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047648356984-mockclientid.apps.googleusercontent.com';
    const scriptId = 'google-gsi-client';
    const existingScript = document.getElementById(scriptId);

    const initGoogleSignIn = () => {
      if (!window.google) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientIdEnv,
          callback: handleCredentialResponse,
          auto_select: false
        });

        const container = document.getElementById('google-signin-btn-container');
        if (container) {
          window.google.accounts.id.renderButton(
            container,
            { 
              theme: 'dark', 
              size: 'large', 
              width: 320, 
              text: 'signin_with',
              shape: 'pill'
            }
          );
        }
      } catch (err) {
        console.error('Google initialize error:', err);
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      script.onerror = () => {
        console.error('Failed to load Google Sign-In SDK.');
        setError('Unable to load Google Authentication client. Please check your network connection.');
      };
      document.body.appendChild(script);
    } else {
      setTimeout(initGoogleSignIn, 100);
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Server returned invalid response (Status ${res.status}). Verify your backend server is running.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with backend');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      console.error('Authentication failed:', err.message);
      setError(err.message || 'Verification of Google token failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTraditionalAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Server returned invalid response (Status ${res.status}). Verify your backend server is running.`);
      }

      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="scrollContainer">
      
      {/* Floating Theme Toggle */}
      <button 
        className="themeToggleFloating" 
        onClick={onToggleTheme} 
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle Light/Dark Theme"
      >
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      {/* Floating Top Header Overlay */}
      <header className="headerOverlay">
        <div className="headerBrand">
          <span className="headerIcon">🏥</span>
          <h2 className="headerTitle">MED-VERIFY PRO</h2>
        </div>
        <div className="headerMeta">
          <span className="headerTag">HIPAA SECURED</span>
          <span className="headerBadge">M1 HPR Verified</span>
        </div>
      </header>

      {/* Dynamic Ambient Background Mesh */}
      <div className="meshBackdrop">
        <div className={`glowCircle cyanCircle`} />
        <div className={`glowCircle purpleCircle`} />
      </div>

      {/* Horizontally scrolling slides */}
      <div ref={scrollSectionRef} className="scrollTrack">
        
        {/* Slide 1: Welcome & Mission narrative */}
        <section className="slideSection">
          <div className="narrativeBlock">
            <span className="slideNumber">01 // System Infrastructure</span>
            <h2 className={`revealText slideTitle`}>
              Democratizing <br />
              <span className="gradientText">Clinical Veracity</span>
            </h2>
            <p className={`revealText slideDesc`}>
              Synthesizing real-time science indices across global and national channels (WHO, PubMed, ClinicalTrials, OpenFDA) to neutralize medical misinformation instantly.
            </p>
          </div>
          <div className="scrollIndicator">
            Scroll down to explore onboarding track →
          </div>
        </section>

        {/* Slide 2: Scientific Synthesis Showcase */}
        <section className={`slideSection darkSlide`}>
          <div className="narrativeBlock">
            <span className="slideNumber">02 // Cognitive Architecture</span>
            <h2 className="slideTitle">
              Powered by <br />
              <span className="gradientText">Deep-Science Synthesis</span>
            </h2>
            <p className="slideDesc">
              Harnesses real-time search synthesis algorithms to cross-reference multi-layered research data and output authoritative clinical verification indexes.
            </p>
          </div>
        </section>

        {/* Slide 3: Interactive Glass-morphic Access Card */}
        <section className="slideSection">
          <div className="loginCard">
            {/* Top refraction edge glow */}
            <div className="refractionEdge" />

            <div className="brand">
              <div className="logoIcon">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="15" y="6" width="10" height="28" rx="3" fill="url(#grad1)"/>
                  <rect x="6" y="15" width="28" height="10" rx="3" fill="url(#grad1)"/>
                  <circle cx="28" cy="28" r="10" fill="var(--bg-deep)"/>
                  <circle cx="28" cy="28" r="9" fill="url(#grad2)"/>
                  <path d="M24 28.5l2.5 2.5 5-5" stroke="var(--bg-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--md-primary)"/>
                      <stop offset="1" stopColor="var(--md-secondary)"/>
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--md-primary)"/>
                      <stop offset="1" stopColor="var(--md-primary-dim)"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="brandTitle">Med-Verify <span className="proBadge">PRO</span></h1>
              <p className="brandSubtitle">Clinical Synthesis & Literature Evidence Engine</p>
            </div>

            <div className="infoBanner">
              🔬 Built for <strong>NBEC 2026</strong>. Auto-synthesize claims against peer-reviewed PubMed articles, ongoing clinical studies, and FDA drug recall logs.
            </div>

            {error && <div className="errorAlert">⚠️ {error}</div>}

            <div className="authActions">
              {loading ? (
                <div className="authLoading">
                  <div className="spinner" />
                  <span>Initializing secure session...</span>
                </div>
              ) : (
                <>
                  {/* Traditional Auth Form */}
                  <div className="authTabs">
                    <button 
                      type="button"
                      className={authMode === 'login' ? styles.activeAuthTab : styles.authTab} 
                      onClick={() => setAuthMode('login')}
                    >
                      Sign In
                    </button>
                    <button 
                      type="button"
                      className={authMode === 'signup' ? styles.activeAuthTab : styles.authTab} 
                      onClick={() => setAuthMode('signup')}
                    >
                      Create Account
                    </button>
                  </div>

                  <form onSubmit={handleTraditionalAuth} className="traditionalForm">
                    {authMode === 'signup' && (
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        className="authInput"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                      />
                    )}
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="authInput"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required 
                    />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      className="authInput"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required 
                    />
                    <button type="submit" className="submitAuthBtn">
                      {authMode === 'login' ? 'Sign In ➔' : 'Create Account ➔'}
                    </button>
                  </form>

                  <div className="divider">
                    <span className="dividerLine" />
                    <span className="dividerText">or continue with</span>
                    <span className="dividerLine" />
                  </div>

                  {/* Google Sign In Target */}
                  <div className="googleContainer">
                    <div id="google-signin-btn-container" className="googleBtn" />
                  </div>
                </>
              )}
            </div>

            <div className="footerNote">
              🔒 Secure OAuth authorization. Production ready.
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
