import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LegalModal from './LegalModal';

export default function Footer() {
  const [legalDoc, setLegalDoc] = useState(null);

  return (
    <>
      <footer className="w-full py-12 px-6 lg:px-12 bg-surface border-t border-outline/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="font-headline text-2xl text-on-surface font-bold text-gradient-primary">MedVerify Systems</div>
            <div className="font-body text-sm text-on-surface-variant text-center md:text-left">
              Truth in Medicine, Beautifully Verified.
            </div>
          </div>
          
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
              <a className="font-body text-sm text-on-surface hover:text-primary hover:underline transition-all cursor-pointer font-medium" onClick={() => setLegalDoc('privacy')}>Privacy Policy</a>
              <a className="font-body text-sm text-on-surface hover:text-primary hover:underline transition-all cursor-pointer font-medium" onClick={() => setLegalDoc('terms')}>Terms of Service</a>
              <Link className="font-body text-sm text-on-surface hover:text-primary hover:underline transition-all cursor-pointer font-medium" to="/contact">Contact Support</Link>
          </nav>
        </div>
      </footer>
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
