import React from 'react';

const STEPS = [
  { id: 1, icon: '👁', label: 'OCR Processing', sublabel: 'Mistral OCR extracting text from image...' },
  { id: 2, icon: '📊', label: 'Querying WHO Database', sublabel: 'Fetching global health statistics...' },
  { id: 3, icon: '🏥', label: 'Evidence Collection', sublabel: 'Retrieving MyHealthfinder guidelines...' },
  { id: 4, icon: '🧠', label: 'AI Reasoning', sublabel: 'Gemini Frontier Models synthesizing verdict...' },
];

export default function LoadingSpinner({ hasImage = false }) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 bg-surface-container-low/50 rounded-2xl border border-outline-variant/50 animate-fade-in-up" role="status" aria-label="Verifying claim...">
      
      {/* Orb */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
        <div className="absolute inset-2 bg-tertiary/30 rounded-full animate-pulse opacity-75"></div>
        <div className="relative z-10 w-16 h-16 bg-surface rounded-full flex items-center justify-center shadow-lg border border-primary/30 text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
        </div>
      </div>

      <div className="text-center mb-10">
        <h3 className="font-headline text-2xl text-on-surface mb-2">Analyzing Medical Claim</h3>
        <p className="font-body text-on-surface-variant">Cross-referencing against authoritative sources...</p>
      </div>

      <div className="w-full flex flex-col gap-4">
        {STEPS.filter(s => hasImage || s.id !== 1).map((step, i) => (
          <div key={step.id} className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 relative overflow-hidden group">
            
            <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                <div className="h-full bg-primary animate-pulse w-1/2"></div>
            </div>

            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-variant/50 rounded-full text-xl">
              {step.icon}
            </div>
            
            <div className="flex-1">
              <div className="font-headline text-on-surface font-semibold">{step.label}</div>
              <div className="font-body text-xs text-on-surface-variant">{step.sublabel}</div>
            </div>
            
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        ))}
      </div>

      <div className="mt-8 font-body text-xs text-secondary text-center bg-surface-variant/30 px-4 py-2 rounded-full">
        🔒 Your data is processed securely · Results are for educational purposes only
      </div>
    </div>
  );
}
