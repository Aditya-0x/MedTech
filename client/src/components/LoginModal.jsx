import React, { useEffect, useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, theme, onToggleTheme }) {
  const [step, setStep] = useState('email'); // 'email' | 'name' | 'otp'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (!isOpen) {
      setStep('email');
      setEmail('');
      setOtp('');
      setName('');
      setError(null);
      setLoading(false);
      return;
    }

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
      script.onerror = () => setError('Unable to load Google Authentication client.');
      document.body.appendChild(script);
    } else {
      setTimeout(initGoogleSignIn, 150);
    }
  }, [isOpen, theme]);

  // Separate effect to render the google button when the container is available
  useEffect(() => {
    if (isOpen && step === 'email' && !loading && window.google) {
      const renderBtn = () => {
        const container = document.getElementById('modal-google-signin-btn');
        if (container && window.google.accounts.id.renderButton) {
          container.innerHTML = ''; // clear before render
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
      };
      // Short delay to ensure DOM is ready after state change
      const t = setTimeout(renderBtn, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, step, loading, theme]);

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
      setError(err.message || 'Verification email failed to send. Check server connection.');
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-4 animate-fade-in-up" onClick={onClose}>
      <div 
        className="glass-panel w-full max-w-md rounded-2xl shadow-float overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface text-xl" onClick={onClose} aria-label="Close modal">✕</button>
        
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
            <h1 className="font-headline text-3xl text-on-surface font-bold">Sign In</h1>
          </div>
          <p className="font-body text-sm text-on-surface-variant mb-6">Passwordless Secure Clinical Fact-Checking</p>

          {error && (
            <div className={`mb-6 p-4 text-sm font-body rounded-lg flex items-start gap-2 ${error.includes('dispatched') ? 'bg-surface-container-high text-primary' : 'bg-error-container text-on-error-container'}`}>
              <span className="material-symbols-outlined mt-0.5">{error.includes('dispatched') ? 'mark_email_read' : 'error'}</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
              <span className="font-body text-sm text-on-surface-variant">Verifying secure clinical tunnel...</span>
            </div>
          ) : (
            <>
              {step === 'email' && (
                <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-sm font-bold text-on-surface">Email Address</label>
                    <input 
                      type="email"
                      placeholder="e.g. aditya@medverify.org"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="bg-primary text-on-primary py-3 rounded-lg font-body font-medium hover:bg-on-primary-fixed-variant transition-colors w-full mt-2 shadow-soft">
                    Verify Email & Send OTP ➔
                  </button>
                </form>
              )}

              {step === 'name' && (
                <form onSubmit={(e) => { e.preventDefault(); setStep('otp'); }} className="flex flex-col gap-4">
                  <div className="bg-surface-container-low p-4 rounded-lg font-body text-sm text-on-surface mb-2">
                    ✨ Welcome! Your email is not registered yet. Please enter your name to set up a free profile.
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-sm font-bold text-on-surface">Full Name</label>
                    <input 
                      type="text"
                      placeholder="Dr. Rajesh Kumar"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="bg-primary text-on-primary py-3 rounded-lg font-body font-medium hover:bg-on-primary-fixed-variant transition-colors w-full mt-2 shadow-soft">
                    Next: Enter Security Code ➔
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="bg-surface-container-low p-4 rounded-lg font-body text-sm text-on-surface mb-2 border border-outline-variant/30">
                    ✉️ Security OTP code sent to <strong className="text-primary">{email}</strong>. Check your spam folder if not received.
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-sm font-bold text-on-surface">6-Digit Security Code</label>
                    <input 
                      type="text"
                      maxLength="6"
                      placeholder="••••••"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body tracking-[0.5em] text-center text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="bg-primary text-on-primary py-3 rounded-lg font-body font-medium hover:bg-on-primary-fixed-variant transition-colors w-full mt-2 shadow-soft flex items-center justify-center gap-2">
                    Confirm Access Code <span className="material-symbols-outlined text-sm">login</span>
                  </button>

                  <div className="flex justify-between items-center mt-2 font-body text-sm">
                    <button type="button" className="text-secondary hover:text-primary transition-colors flex items-center gap-1" onClick={() => setStep(isNewUser ? 'name' : 'email')}>
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                    </button>
                    <button type="button" className={`transition-colors font-semibold ${resendTimer > 0 ? 'text-secondary/50 cursor-not-allowed' : 'text-primary hover:underline'}`} onClick={handleResendOtp} disabled={resendTimer > 0}>
                      {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'email' && (
                <>
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-outline-variant/60"></div>
                    <div className="px-4 text-xs font-body text-secondary uppercase tracking-wider">or securely continue with</div>
                    <div className="flex-1 border-t border-outline-variant/60"></div>
                  </div>
                  <div className="flex justify-center w-full min-h-[44px]">
                    <div id="modal-google-signin-btn" className="flex justify-center" />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="bg-surface-container-low p-4 text-center font-body text-xs text-secondary border-t border-outline-variant/60 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[14px]">lock</span> HIPAA secured. Zero data retention policies active.
        </div>
      </div>
    </div>
  );
}
