import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function ContactPage() {
  return (
    <div className="font-body bg-background text-on-background min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-10 h-20 bg-surface-container-lowest border-b border-outline/10">
        <a href="/" className="font-headline text-3xl font-bold text-gradient-primary drop-shadow-sm tracking-tight cursor-pointer mr-4 hover:scale-105 transition-transform duration-300">
          MedVerify
        </a>
        <nav className="hidden md:flex items-center gap-10">
          <a href="/" className="font-body text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300">
            Back to App
          </a>
        </nav>
      </header>

      <main className="flex-grow pt-32 pb-16 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-headline text-5xl font-bold text-on-surface mb-6">Contact Support</h1>
        <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 leading-relaxed">
          Need help navigating MedVerify? We are here for you. Reach out to our dedicated support team directly.
        </p>

        <a href="mailto:support@medverify.systems" className="bg-primary-container text-white px-8 py-4 rounded-full font-body font-medium hover:bg-primary-container/90 transition-all duration-300 shadow-none flex items-center gap-3 justify-center text-lg">
          <span className="material-symbols-outlined">mail</span>
          support@medverify.systems
        </a>
      </main>

      <footer className="w-full py-8 px-6 bg-surface border-t border-outline/10 text-center">
        <div className="font-body text-xs text-on-surface-variant">
          © 2026 MedVerify Systems, Inc. All rights reserved.
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
