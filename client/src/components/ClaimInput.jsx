import React, { useState } from 'react';
import styles from './ClaimInput.module.css';

const EXAMPLE_CLAIMS = [
  "Sugar directly causes diabetes in healthy people",
  "Vaccines cause autism in children",
  "Coffee prevents Alzheimer's disease",
  "Exercising for 30 minutes a day prevents heart disease",
  "Vitamin C cures the common cold"
];

export default function ClaimInput({ onVerify, isLoading }) {
  const [claim, setClaim] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e) => {
    setClaim(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSubmit = () => {
    if (claim.trim().length >= 10 && !isLoading) onVerify({ claim: claim.trim() });
  };

  const handleExample = (example) => {
    setClaim(example);
    setCharCount(example.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <div className={styles.inputHeader}>
          <label className={styles.label} htmlFor="claim-input">
            <span className={styles.labelIcon}>📋</span>
            Medical Claim or Statement
          </label>
          <span className={`${styles.charCount} ${charCount > 800 ? styles.charCountWarn : ''}`}>
            {charCount}/1000
          </span>
        </div>

        <textarea
          id="claim-input"
          className={styles.textarea}
          value={claim}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Paste or type a medical claim here…&#10;&#10;e.g. &quot;Eating chocolate every day improves heart health&quot;&#10;&#10;Tip: You can paste entire social media posts for full context analysis."
          rows={6}
          maxLength={1000}
          disabled={isLoading}
        />

        <div className={styles.inputFooter}>
          <span className={styles.hint}>Press Ctrl+Enter to verify</span>
          <button
            id="verify-claim-btn"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isLoading || claim.trim().length < 10}
          >
            {isLoading ? (
              <>
                <span className={styles.spinnerSmall}/>
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Verify Claim
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example pills */}
      <div className={styles.examples}>
        <span className={styles.examplesLabel}>Try an example:</span>
        <div className={styles.examplePills}>
          {EXAMPLE_CLAIMS.map((ex, i) => (
            <button
              key={i}
              className={styles.pill}
              onClick={() => handleExample(ex)}
              disabled={isLoading}
              title={ex}
            >
              {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
