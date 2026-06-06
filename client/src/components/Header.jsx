import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ user, onLogout, showHero, theme, onToggleTheme, onSignInClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    onSignInClick();
    setIsMenuOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-10 h-20 bg-surface-container-lowest border-b border-outline/10 transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-16">
          <Link 
            to="/"
            className="font-headline text-2xl sm:text-3xl font-bold text-gradient-primary drop-shadow-sm tracking-tight cursor-pointer mr-4 hover:scale-105 transition-transform duration-300" 
            onClick={handleNavClick}
          >
          MedVerify
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          <Link
            to="/"
            className={`font-body text-label-md transition-colors duration-300 ${path === '/' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={handleNavClick}
          >
            Claims
          </Link>
          <Link
            to="/trumeds"
            className={`font-body text-label-md transition-colors duration-300 ${path === '/trumeds' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={handleNavClick}
          >
            TruMeds
          </Link>
          {user ? (
            <Link
              to="/history"
              className={`font-body text-label-md transition-colors duration-300 ${path === '/history' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={handleNavClick}
            >
              Archive
            </Link>
          ) : (
            <button
              className={`font-body text-label-md transition-colors duration-300 ${path === '/history' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={onSignInClick}
            >
              Archive 🔒
            </button>
          )}
          <Link
            to="/contact"
            className={`font-body text-label-md transition-colors duration-300 ${path === '/contact' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={handleNavClick}
          >
            Contact
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <button 
          className="text-on-surface-variant hover:text-primary transition-colors"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <span className="material-symbols-outlined text-2xl">light_mode</span>
          ) : (
            <span className="material-symbols-outlined text-2xl">dark_mode</span>
          )}
        </button>

        {user ? (
          <div className="hidden md:flex items-center gap-4">
             <div className="font-body text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
               ✨ {user.points !== undefined ? user.points : 0} pts
             </div>
             <img 
               src={user.picture} 
               alt={user.name} 
               className="w-8 h-8 rounded-full border border-outline-variant"
               referrerPolicy="no-referrer"
               title={user.name}
             />
             <button 
               className="text-on-surface-variant hover:text-error transition-colors"
               onClick={handleLogoutClick}
               title="Log Out"
             >
               <span className="material-symbols-outlined text-2xl">logout</span>
             </button>
          </div>
        ) : (
          <button 
            className="hidden md:flex items-center justify-center bg-primary-container text-white px-6 py-2.5 rounded-full font-body text-sm font-semibold hover:bg-primary-container/90 transition-colors duration-300"
            onClick={handleSignIn}
          >
            Verify Now / Sign In
          </button>
        )}

        <button 
          className="md:hidden text-on-surface"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-symbols-outlined text-3xl transition-transform duration-200" style={{ fontVariationSettings: "'FILL' 0" }}>{isMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`absolute top-20 left-0 w-full bg-surface-container-lowest border-b border-outline-variant/60 shadow-lg p-6 flex flex-col gap-4 md:hidden z-40 transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
         <Link
          to="/"
          className={`text-left font-body text-lg ${path === '/' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
          onClick={handleNavClick}
        >
          Claims
        </Link>
        <Link
          to="/trumeds"
          className={`text-left font-body text-lg ${path === '/trumeds' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
          onClick={handleNavClick}
        >
          TruMeds
        </Link>
        {user ? (
          <Link
            to="/history"
            className={`text-left font-body text-lg ${path === '/history' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
            onClick={handleNavClick}
          >
            Archive
          </Link>
        ) : (
          <button
            className={`text-left font-body text-lg ${path === '/history' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
            onClick={onSignInClick}
          >
            Archive 🔒
          </button>
        )}
        <Link
          to="/contact"
          className={`text-left font-body text-lg ${path === '/contact' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
          onClick={handleNavClick}
        >
          Contact
        </Link>
        <hr className="border-outline-variant/30 my-2" />
        {user ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
               <span className="font-body font-medium text-on-surface">{user.name}</span>
            </div>
            <button onClick={handleLogoutClick} className="text-error font-medium hover:underline transition-all">Logout</button>
          </div>
        ) : (
          <button 
            className="w-full bg-primary-container text-white py-3 rounded-full font-body font-semibold hover:bg-primary-container/90 transition-colors duration-300"
            onClick={handleSignIn}
          >
            Verify Now / Sign In
          </button>
        )}
      </div>
    </header>
  );
}
