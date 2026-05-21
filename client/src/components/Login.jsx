import React, { useEffect, useState } from 'react';
import styles from './Login.module.css';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Traditional Auth State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

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
      // Script already loaded, wait a short tick to ensure it parsed
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

      const data = await res.json();
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Dynamic Ambient Background Mesh */}
      <div className={styles.meshBackdrop}>
        <div className={`${styles.glowCircle} ${styles.cyanCircle}`} />
        <div className={`${styles.glowCircle} ${styles.purpleCircle}`} />
      </div>

      <div className={styles.loginCard}>
        {/* Top refraction edge glow */}
        <div className={styles.refractionEdge} />

        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="6" width="10" height="28" rx="3" fill="url(#grad1)"/>
              <rect x="6" y="15" width="28" height="10" rx="3" fill="url(#grad1)"/>
              <circle cx="28" cy="28" r="10" fill="#07060f"/>
              <circle cx="28" cy="28" r="9" fill="url(#grad2)"/>
              <path d="M24 28.5l2.5 2.5 5-5" stroke="#07060f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00e5cc"/>
                  <stop offset="1" stopColor="#b388ff"/>
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00e5cc"/>
                  <stop offset="1" stopColor="#5df5c0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.brandTitle}>Med-Verify <span className={styles.proBadge}>PRO</span></h1>
          <p className={styles.brandSubtitle}>Clinical Synthesis & Literature Evidence Engine</p>
        </div>

        <div className={styles.infoBanner}>
          🔬 Built for <strong>NBEC 2026</strong>. Auto-synthesize claims against peer-reviewed PubMed articles, ongoing clinical studies, and FDA drug recall logs.
        </div>

        {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

        <div className={styles.authActions}>
          {loading ? (
            <div className={styles.authLoading}>
              <div className={styles.spinner} />
              <span>Initializing secure session...</span>
            </div>
          ) : (
            <>
              {/* Traditional Auth Form */}
              <div className={styles.authTabs}>
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

              <form onSubmit={handleTraditionalAuth} className={styles.traditionalForm}>
                {authMode === 'signup' && (
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className={styles.authInput}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                )}
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className={styles.authInput}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className={styles.authInput}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                />
                <button type="submit" className={styles.submitAuthBtn}>
                  {authMode === 'login' ? 'Sign In ➔' : 'Create Account ➔'}
                </button>
              </form>

              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>or continue with</span>
                <span className={styles.dividerLine} />
              </div>

              {/* Google Sign In Target */}
              <div className={styles.googleContainer}>
                <div id="google-signin-btn-container" className={styles.googleBtn} />
              </div>
            </>
          )}
        </div>

        <div className={styles.footerNote}>
          🔒 Secure OAuth authorization. Production ready.
        </div>
      </div>
    </div>
  );
}
