import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header';
import Contact from './components/Contact';
import styles from './App.module.css';
import './index.css';

function ContactPage() {
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

  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('medverify_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    }
  }, []);

  return (
    <div className={styles.app}>
      <Header 
        user={user}
        activeView="contact"
        onViewChange={(view) => {
          if (view === 'verify' || view === 'history') {
            window.location.href = `/?view=${view}`;
          } else if (view === 'about') {
            window.location.href = '/about.html';
          }
        }}
        onLogout={() => {
          localStorage.removeItem('medverify_user');
          localStorage.removeItem('medverify_token');
          window.location.href = '/';
        }}
        showHero={false}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignInClick={() => {
          window.location.href = '/?promptLogin=true';
        }}
      />

      <main className={`${styles.main} contact-main-override`}>
        <Contact />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <p className={styles.footerText}>
            © 2026 Med-Verify Systems, Inc. All rights reserved. 
            Synthesizing secure, authoritative clinical data from WHO, PubMed, and FDA. 
            All clinical verification pipelines are compliant under Ayushman Bharat Digital Mission (ABDM) and HIPAA guidelines.
          </p>
          <div className={styles.footerSection}>
            <strong>Platform</strong>
            <a href="/">Verify Claim</a>
            <span className={styles.footerDivider}>•</span>
            <a href="/about.html">About Creator</a>
            <span className={styles.footerDivider}>•</span>
            <a href="/contact.html" style={{ color: 'var(--md-primary)' }}>Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('contact-root')).render(
  <React.StrictMode>
    <ContactPage />
  </React.StrictMode>
);
