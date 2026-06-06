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
    <div className="flex flex-col sm:flex-row w-full h-full relative animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
      <textarea
        id="claim-input"
        className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-6 text-lg font-body placeholder-on-surface-variant/50 text-on-surface min-h-[100px]"
        value={claim}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter a medical claim, article URL, or symptom... (Press Ctrl+Enter to verify)"
        rows={2}
        maxLength={1000}
        disabled={isLoading}
      />
      <button
        id="verify-claim-btn"
        className={`m-2 self-center sm:self-end mb-2 sm:mb-2 bg-primary-container text-white px-6 py-3 text-sm rounded-full font-body font-medium hover:bg-primary-container/90 transition-all duration-300 whitespace-nowrap flex items-center gap-2 justify-center group ${isLoading || claim.trim().length < 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">fact_check</span>
            Verify Claim
          </>
        )}
      </button>
    </div>
  );
}
