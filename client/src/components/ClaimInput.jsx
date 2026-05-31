import React, { useState } from 'react';

export default function ClaimInput({ onVerify, isLoading }) {
  const [claim, setClaim] = useState('');

  const handleChange = (e) => {
    setClaim(e.target.value);
  };

  const handleSubmit = () => {
    if (claim.trim().length >= 10 && !isLoading) onVerify({ claim: claim.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className="flex flex-col sm:flex-row w-full h-full relative">
      <textarea
        id="claim-input"
        className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-6 text-lg font-body placeholder-on-surface-variant/50 text-on-surface h-32 sm:h-auto"
        value={claim}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter a medical claim, article URL, or symptom... (Press Ctrl+Enter to verify)"
        rows={3}
        maxLength={1000}
        disabled={isLoading}
      />
      <button
        id="verify-claim-btn"
        className={`m-2 bg-gradient-to-r from-primary to-tertiary text-on-primary px-8 py-4 rounded-lg font-body font-medium hover:from-primary-container hover:to-tertiary-container hover:text-on-primary-container hover:scale-105 hover:shadow-float transition-all duration-300 shadow-soft whitespace-nowrap flex items-center gap-2 justify-center group ${isLoading || claim.trim().length < 10 ? 'opacity-50 cursor-not-allowed' : 'hover:animate-sexy-pulse'}`}
        onClick={handleSubmit}
        disabled={isLoading || claim.trim().length < 10}
      >
        {isLoading ? (
          <>
            <span className="animate-spin material-symbols-outlined">progress_activity</span>
            Analyzing...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">fact_check</span>
            Verify Claim
          </>
        )}
      </button>
    </div>
  );
}
