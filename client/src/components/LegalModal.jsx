import React from 'react';

export default function LegalModal({ doc, onClose }) {
  if (!doc) return null;

  const isPrivacy = doc === 'privacy';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-float flex flex-col max-h-[85vh] animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/40">
          <h2 className="font-headline text-3xl text-on-surface">
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-8 overflow-y-auto font-body text-on-surface-variant space-y-6">
          {isPrivacy ? (
            <>
              <section>
                <h3 className="text-xl font-bold text-on-surface mb-2">1. HIPAA Compliance & Data Scrubbing</h3>
                <p className="leading-relaxed">Med-Verify Pro is designed with a strict Zero-Data-Retention (ZDR) policy. All queries submitted to our platform are scrubbed of Protected Health Information (PHI) before interacting with public APIs. We do not store patient-identifiable data within our analysis cache.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-on-surface mb-2">2. Information Collection</h3>
                <p className="leading-relaxed">We only collect standard authentication data provided by Google Identity Services when you sign in, consisting of your email and display name. Your generated clinical reports are securely stored under your user token and can be completely wiped upon request.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-on-surface mb-2">3. Third-Party Integrations</h3>
                <p className="leading-relaxed">Our verification pipelines interact directly with WHO, CDC, FDA, and PubMed databases. Your queries are anonymized prior to these network calls to ensure complete diagnostic privacy.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-xl font-bold text-on-surface mb-2">1. Not Medical Advice</h3>
                <p className="leading-relaxed">Med-Verify Pro provides clinical context synthesis using public data. It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-on-surface mb-2">2. Usage Restrictions</h3>
                <p className="leading-relaxed">You agree not to use Med-Verify Pro to generate automated high-volume diagnostic reports without proper API licensing. Reverse engineering of our NLP verification models and authority scoring matrix is strictly prohibited.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-on-surface mb-2">3. Limitation of Liability</h3>
                <p className="leading-relaxed">Med-Verify Systems, Inc. shall not be liable for any medical decisions made based on the synthesized output of our system. The tool is provided for educational and research veracity purposes only.</p>
              </section>
            </>
          )}
        </div>
        <div className="p-6 border-t border-outline-variant/40 bg-surface-container flex justify-end rounded-b-3xl">
          <button 
            onClick={onClose}
            className="bg-primary text-on-primary px-8 py-2.5 rounded-xl font-bold hover:bg-on-primary-fixed-variant transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
