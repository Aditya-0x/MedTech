import React, { useEffect, useRef, useState } from 'react';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, theme, onToggleTheme }) {
  const [step, setStep] = useState('email'); // 'email' | 'name' | 'otp'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [showSlides, setShowSlides] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // 1. Manage Resend OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // 2. Initialize Google Sign-in API GSI side-by-side
  useEffect(() => {
    if (!isOpen) return;

    const clientIdEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047648356984-mockclientid.apps.googleusercontent.com';
    const scriptId = 'google-gsi-client';
    const existingScript = document.getElementById(scriptId);

    const initGoogleSignIn = () => {
      if (!window.google) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientIdEnv,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        // Small delay ensures container ref is fully rendered
        setTimeout(() => {
          const container = document.getElementById('modal-google-signin-btn');
          if (container) {
            window.google.accounts.id.renderButton(
              container,
              { 
                theme: theme === 'dark' ? 'dark' : 'filled_blue', 
                size: 'large', 
                width: 320, 
                text: 'signin_with',
                shape: 'pill'
              }
            );
          }
        }, 100);
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
        setError('Unable to load Google Authentication client.');
      };
      document.body.appendChild(script);
    } else {
      setTimeout(initGoogleSignIn, 150);
    }
  }, [isOpen, theme]);

  if (!isOpen) return null;

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to authenticate with Google');

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Google verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Passwordless OTP Actions
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate security code');

      setIsNewUser(data.isNewUser);
      setResendTimer(60);

      if (data.isNewUser) {
        setStep('name');
      } else {
        setStep('otp');
      }
    } catch (err) {
      setError(err.message || 'Verification email failed to send.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Verification failed. Please double check the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code');

      setResendTimer(60);
      setError('A new verification code has been dispatched to your inbox!');
    } catch (err) {
      setError(err.message || 'Failed to resend email.');
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Slides Data
  const slides = [
    {
      title: 'Democratizing Clinical Veracity',
      desc: 'Synthesizing global epidemiological data indices across multiple scientific networks (WHO, PubMed, ClinicalTrials, OpenFDA) to neutralize misinformation instantly.',
      badge: '01 // SYSTEM PLATFORM'
    },
    {
      title: 'AYUSHMAN BHARAT Interoperable',
      desc: 'Aligned with India\'s Ayushman Bharat Digital Mission (ABDM). Supports FHIR Document bundles and SNOMED-CT clinical terminology mapping protocols.',
      badge: '02 // STANDARDS COMPLIANCE'
    },
    {
      title: 'Zero-Data-Retention Security',
      desc: 'Automatic Zero-Data-Retention filters scrub all personal health information (PHI) before AI synthesis passes, keeping patient logs completely HIPAA-safe.',
      badge: '03 // HIPAA PRIVACY'
    }
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modalCard} ${showSlides ? styles.modalCardWide : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top edge gradient highlight */}
        <div className={styles.refractionEdge} />

        {/* Left Side: Interactive Onboarding slides (Optional/Responsive toggle) */}
        {showSlides && (
          <div className={styles.carouselSection}>
            <div className={styles.carouselContent}>
              <span className={styles.slideBadge}>{slides[activeSlide].badge}</span>
              <h2 className={styles.slideTitle}>{slides[activeSlide].title}</h2>
              <p className={styles.slideDesc}>{slides[activeSlide].desc}</p>
            </div>
            
            <div className={styles.carouselControls}>
              <div className={styles.carouselDots}>
                {slides.map((_, i) => (
                  <button 
                    key={i} 
                    className={`${styles.carouselDot} ${activeSlide === i ? styles.carouselDotActive : ''}`} 
                    onClick={() => setActiveSlide(i)}
                  />
                ))}
              </div>
              <button 
                className={styles.skipBtn} 
                onClick={() => setShowSlides(false)}
              >
                Hide Info Panel ✕
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Authentication Card */}
        <div className={styles.authSection}>
          {/* Header */}
          <div className={styles.header}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="15" y="6" width="10" height="28" rx="3" fill="url(#grad1)"/>
                  <rect x="6" y="15" width="28" height="10" rx="3" fill="url(#grad1)"/>
                  <circle cx="28" cy="28" r="10" fill="var(--bg-surface)"/>
                  <circle cx="28" cy="28" r="9" fill="url(#grad2)"/>
                  <path d="M24 28.5l2.5 2.5 5-5" stroke="var(--bg-surface)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--md-primary)"/>
                      <stop offset="1" stopColor="var(--md-secondary)"/>
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--md-primary)"/>
                      <stop offset="1" stopColor="#5df5c0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className={styles.brandTitle}>Med-Verify <span className={styles.proBadge}>PRO</span></h1>
            </div>
            <p className={styles.brandSubtitle}>Passwordless Secure Clinical Fact-Checking Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`${styles.alert} ${error.includes('dispatched') ? styles.alertSuccess : ''}`}>
              {error.includes('dispatched') ? '✉️' : '⚠️'} {error}
            </div>
          )}

          {/* Main Auth States */}
          {loading ? (
            <div className={styles.loadingWrapper}>
              <div className={styles.spinner} />
              <span>Verifying secure clinical tunnel...</span>
            </div>
          ) : (
            <>
              {/* Step 1: Email Form */}
              {step === 'email' && (
                <form onSubmit={handleRequestOtp} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input 
                      type="email"
                      placeholder="e.g. aditya@medverify.pro"
                      className={styles.input}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Verify Email & Send OTP ➔
                  </button>
                </form>
              )}

              {/* Step 2: Name Entry for Registration */}
              {step === 'name' && (
                <form onSubmit={(e) => { e.preventDefault(); setStep('otp'); }} className={styles.form}>
                  <div className={styles.alertInfo}>
                    ✨ Welcome! Your email is not registered yet. Please enter your name to set up a free Pro profile:
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Full Name</label>
                    <input 
                      type="text"
                      placeholder="Dr. Aditya Verma"
                      className={styles.input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Next: Enter Security Code ➔
                  </button>
                </form>
              )}

              {/* Step 3: OTP Code Entry */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className={styles.form}>
                  <div className={styles.alertInfo}>
                    ✉️ Security OTP code sent to <strong>{email}</strong>. Please check your spam folder if not received.
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>6-Digit Security Code</label>
                    <input 
                      type="text"
                      maxLength="6"
                      placeholder="••••••"
                      className={`${styles.input} ${styles.inputOtp}`}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Confirm Access Code & Sign In ➔
                  </button>

                  <div className={styles.resendRow}>
                    <button 
                      type="button" 
                      className={styles.backBtn} 
                      onClick={() => setStep(isNewUser ? 'name' : 'email')}
                    >
                      ← Back
                    </button>
                    <button 
                      type="button" 
                      className={styles.resendBtn} 
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                    >
                      {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}

              {/* Social Login Divider (Only in Step 1) */}
              {step === 'email' && (
                <>
                  <div className={styles.divider}>
                    <span className={styles.dividerLine} />
                    <span className={styles.dividerText}>or securely continue with</span>
                    <span className={styles.dividerLine} />
                  </div>

                  {/* Google OAuth SDK mount target */}
                  <div className={styles.googleContainer}>
                    <div id="modal-google-signin-btn" className={styles.googleBtn} />
                  </div>
                </>
              )}
            </>
          )}

          {/* Info toggle footer */}
          {!showSlides && (
            <button 
              className={styles.toggleSlidesBtn} 
              onClick={() => setShowSlides(true)}
            >
              📖 View ABDM & Platform Specifications
            </button>
          )}

          <div className={styles.footerNote}>
            🔒 HIPAA & ABDM secured. Zero data retention policies active.
          </div>
        </div>
      </div>
    </div>
  );
}
