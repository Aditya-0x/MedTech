import React from 'react';
import styles from './LoadingSpinner.module.css';

const STEPS = [
  { id: 1, icon: '👁', label: 'OCR Processing', sublabel: 'Mistral OCR extracting text from image...' },
  { id: 2, icon: '📊', label: 'Querying WHO Database', sublabel: 'Fetching global health statistics...' },
  { id: 3, icon: '🏥', label: 'Evidence Collection', sublabel: 'Retrieving MyHealthfinder guidelines...' },
  { id: 4, icon: '🧠', label: 'AI Reasoning', sublabel: 'Gemini Frontier Models synthesizing verdict...' },
];

export default function LoadingSpinner({ hasImage = false }) {
  return (
    <div className={styles.container} role="status" aria-label="Verifying claim...">
      <div className={styles.orb}>
        <div className={styles.orbInner}>
          <div className={styles.orbCore}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="url(#orbGrad)" strokeWidth="1.5"/>
              <path d="M8 12h8M12 8v8" stroke="url(#orbGrad)" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="orbGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--md-primary)"/>
                  <stop offset="1" stopColor="var(--md-secondary)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className={styles.ring1}/>
        <div className={styles.ring2}/>
        <div className={styles.ring3}/>
      </div>

      <div className={styles.text}>
        <h3 className={styles.title}>Analyzing Medical Claim</h3>
        <p className={styles.subtitle}>Cross-referencing against authoritative sources...</p>
      </div>

      <div className={styles.steps}>
        {STEPS.filter(s => hasImage || s.id !== 1).map((step, i) => (
          <div key={step.id} className={styles.step} style={{ animationDelay: `${i * 0.15}s` }}>
            <div className={styles.stepIconWrap}>
              <span className={styles.stepIcon}>{step.icon}</span>
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepLabel}>{step.label}</div>
              <div className={styles.stepSublabel}>{step.sublabel}</div>
              <div className={styles.stepBar}>
                <div className={styles.stepBarFill} style={{ animationDelay: `${i * 0.4}s` }}/>
              </div>
            </div>
            <div className={styles.stepStatus}>
              <div className={styles.statusDot}/>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.disclaimer}>
        🔒 Your data is processed securely · Results are for educational purposes only
      </div>
    </div>
  );
}
