import React, { useState } from 'react';

export default function Header({ user, activeView, onViewChange, onLogout, showHero, theme, onToggleTheme, onSignInClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (view) => {
    onViewChange(view);
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
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-10 h-20 glass-panel shadow-sm transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-16">
          <a 
            className="font-headline text-3xl font-bold text-gradient-primary drop-shadow-sm tracking-tight cursor-pointer mr-4 hover:scale-105 transition-transform duration-300" 
          onClick={() => handleNavClick('verify')}
        >
          MedVerify
        </a>
        <nav className="hidden md:flex items-center gap-10">
          <button
            className={`font-body text-label-md transition-colors duration-300 ${activeView === 'verify' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => handleNavClick('verify')}
          >
            Claims
          </button>
          <button
            className={`font-body text-label-md transition-colors duration-300 ${activeView === 'generic' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => handleNavClick('generic')}
          >
            TruMeds
          </button>
          <button
            className={`font-body text-label-md transition-colors duration-300 ${activeView === 'history' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => user ? handleNavClick('history') : onSignInClick()}
          >
            Archive {!user && '🔒'}
          </button>
          <button
            className={`font-body text-label-md transition-colors duration-300 ${activeView === 'about' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => handleNavClick('about')}
          >
            Methodology
          </button>
          <button
            className={`font-body text-label-md transition-colors duration-300 ${activeView === 'contact' ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => handleNavClick('contact')}
          >
            Contact
          </button>
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
            className="hidden md:flex items-center justify-center bg-primary text-on-primary px-6 py-2.5 rounded-lg font-body text-sm font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-[0_2px_16px_rgba(58,48,42,0.08)]"
            onClick={handleSignIn}
          >
            Verify Now / Sign In
          </button>
        )}

        <button 
          className="md:hidden text-on-surface"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-background border-b border-outline-variant/60 shadow-lg p-6 flex flex-col gap-4 md:hidden z-40">
           <button
            className={`text-left font-body text-lg ${activeView === 'verify' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            onClick={() => handleNavClick('verify')}
          >
            Claims
          </button>
          <button
            className={`text-left font-body text-lg ${activeView === 'generic' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            onClick={() => handleNavClick('generic')}
          >
            TruMeds
          </button>
          <button
            className={`text-left font-body text-lg ${activeView === 'history' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            onClick={() => user ? handleNavClick('history') : onSignInClick()}
          >
            Archive {!user && '🔒'}
          </button>
          <button
            className={`text-left font-body text-lg ${activeView === 'about' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            onClick={() => handleNavClick('about')}
          >
            Methodology
          </button>
          <button
            className={`text-left font-body text-lg ${activeView === 'contact' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            onClick={() => handleNavClick('contact')}
          >
            Contact
          </button>
          <hr className="border-outline-variant/30 my-2" />
          {user ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                 <span className="font-body font-medium text-on-surface">{user.name}</span>
              </div>
              <button onClick={handleLogoutClick} className="text-error">Logout</button>
            </div>
          ) : (
            <button 
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-body font-semibold"
              onClick={handleSignIn}
            >
              Verify Now / Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
