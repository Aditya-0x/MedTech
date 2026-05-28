import React from 'react';
import styles from './Header.module.css';

export default function Header({ user, activeView, onViewChange, onLogout, showHero, theme, onToggleTheme, onSignInClick }) {
  return (
    <header className={styles.header}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div 
          className={styles.logo} 
          onClick={() => onViewChange('verify')} 
          style={{ cursor: 'pointer' }}
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

        <nav className={styles.navigation}>
          <button
            className={`${styles.navTab} ${activeView === 'verify' ? styles.activeTab : ''}`}
            onClick={() => onViewChange('verify')}
          >
            🔬 Verify
          </button>
          <button
            className={`${styles.navTab} ${activeView === 'history' ? styles.activeTab : ''}`}
            onClick={() => user ? onViewChange('history') : onSignInClick()}
          >
            📊 History {!user && '🔒'}
          </button>
          <button
            className={`${styles.navTab} ${activeView === 'about' ? styles.activeTab : ''}`}
            onClick={() => onViewChange('about')}
          >
            👨‍⚕️ About
          </button>
          <button
            className={`${styles.navTab} ${activeView === 'contact' ? styles.activeTab : ''}`}
            onClick={() => onViewChange('contact')}
          >
            💬 Support
          </button>
        </nav>

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
            <>
              <div className={styles.userProfile}>
                <div className={styles.pointsBadge} title="Gamification Points">
                  ✨ {user.points !== undefined ? user.points : 0} pts
                </div>
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className={styles.avatar} 
                  referrerPolicy="no-referrer"
                  title={user.name}
                />
                <span className={styles.userName}>{user.name}</span>
              </div>
              <button 
                className={styles.logoutBtn} 
                onClick={onLogout} 
                title="Log Out"
                aria-label="Log Out"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <div className={styles.guestRightSection}>
              <button className={styles.signInBtn} onClick={onSignInClick}>
                ✨ Join Pro / Sign In
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}
