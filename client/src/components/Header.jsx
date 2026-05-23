import React from 'react';
import styles from './Header.module.css';

export default function Header({ user, activeView, onViewChange, onLogout, showHero, theme, onToggleTheme }) {
  return (
    <header className={styles.header}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div 
          className={styles.logo} 
          onClick={() => user && onViewChange('verify')} 
          style={{ cursor: user ? 'pointer' : 'default' }}
        >
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cross */}
              <rect x="15" y="6" width="10" height="28" rx="3" fill="url(#grad1)"/>
              <rect x="6" y="15" width="28" height="10" rx="3" fill="url(#grad1)"/>
              {/* Checkmark overlay */}
              <circle cx="28" cy="28" r="10" fill="#050b1f"/>
              <circle cx="28" cy="28" r="9" fill="url(#grad2)"/>
              <path d="M24 28.5l2.5 2.5 5-5" stroke="#050b1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4c8"/>
                  <stop offset="1" stopColor="#4fa3ff"/>
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4c8"/>
                  <stop offset="1" stopColor="#22d3a0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoMain}>Med<span className={styles.logoDash}>-</span>Verify</span>
            <span className={styles.logoSub}>Clinical Fact-Checking Agent</span>
          </div>
        </div>

        {user && (
          <nav className={styles.navigation}>
            <button
              className={`${styles.navTab} ${activeView === 'verify' ? styles.activeTab : ''}`}
              onClick={() => onViewChange('verify')}
            >
              🔬 Verify Claim
            </button>
            <button
              className={`${styles.navTab} ${activeView === 'history' ? styles.activeTab : ''}`}
              onClick={() => onViewChange('history')}
            >
              📊 Clinical History
            </button>
          </nav>
        )}

        <div className={styles.rightSection}>
          <button 
            className={styles.themeToggle} 
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

          {user ? (
            <div className={styles.userProfile}>
              <div className={styles.pointsBadge} title="Gamification Points">
                ✨ {user.points !== undefined ? user.points : 0} pts
              </div>
              <img 
                src={user.picture} 
                alt={user.name} 
                className={styles.avatar} 
                referrerPolicy="no-referrer"
              />
              <span className={styles.userName}>{user.name}</span>
              <button className={styles.logoutBtn} onClick={onLogout} title="Log Out">
                Logout ➔
              </button>
            </div>
          ) : (
            <div className={styles.badges}>
              <span className={styles.badge}>
                <span className={styles.badgeDot} style={{background:'#00d4c8'}}/>
                WHO GHO
              </span>
              <span className={styles.badge}>
                <span className={styles.badgeDot} style={{background:'#4fa3ff'}}/>
                MyHealthfinder
              </span>
              <span className={styles.badge}>
                <span className={styles.badgeDot} style={{background:'#9b7ef8'}}/>
                Gemini AI
              </span>
              <span className={styles.badge}>
                <span className={styles.badgeDot} style={{background:'#ffba3b'}}/>
                Mistral OCR
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hero section */}
      {showHero && (
        <div className={styles.hero}>
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
      )}
    </header>
  );
}
