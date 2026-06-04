import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './index.css';

function ContactPage() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medverify_theme') || 'dark';
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
    <div className="font-body bg-background text-on-background min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
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

      <main className="flex-grow pt-20 flex flex-col items-center">
        <Contact user={user} />
      </main>

      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('contact-root')).render(
  <React.StrictMode>
    <ContactPage />
  </React.StrictMode>
);
