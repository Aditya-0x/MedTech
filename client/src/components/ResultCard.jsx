import React, { useEffect } from 'react';

export default function ResultCard({ result, onReset, isAuthenticated, isSaved, onSave, onSignInRequired }) {
  if (!result) return null;

  const verdict = result.verdict?.verdict || 'UNVERIFIED';
  const confidence = result.verdict?.confidence || 0;
  
  const pubmedList = result.sources?.pubmed || result.verdict?.bibliography?.pubmed || [];
  const clinicalTrialsList = result.sources?.clinicalTrials || result.verdict?.bibliography?.clinicalTrials || [];
  const fdaAlertsList = result.sources?.fdaAlerts || result.verdict?.bibliography?.fdaAlerts || [];
  const whoSources = result.sources?.who || [];
  const healthfinderSources = result.sources?.healthfinder || [];

  const totalSources = pubmedList.length + clinicalTrialsList.length + fdaAlertsList.length + whoSources.length + healthfinderSources.length;

  const dateStr = new Date(result.meta?.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Interactive mag glass follower script
  useEffect(() => {
    const container = document.getElementById('evidence-container');
    const follower = document.getElementById('mag-glass-follower');
    
    if (container && follower) {
        follower.style.pointerEvents = 'none';

        const handleMouseMove = (e) => {
            follower.style.display = 'flex';
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            requestAnimationFrame(() => {
                follower.style.transform = `translate(${x - 32}px, ${y - 32}px)`;
            });
        };

        const handleMouseLeave = () => {
            follower.style.display = 'none';
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center animate-fade-in-up" id="result-card">
      
      {/* Verification Header / Hero */}
      <section className="w-full max-w-5xl flex flex-col items-center text-center mb-20">
        
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary-fixed border border-primary/20 animate-soft-pulse mb-10 shadow-[0_4px_24px_rgba(194,101,42,0.15)]">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {verdict === 'TRUE' ? 'verified' : verdict === 'FALSE' ? 'cancel' : 'warning'}
            </span>
            <span className="font-body font-bold text-sm tracking-widest uppercase text-on-primary-fixed">
              {verdict} Consensus ({confidence}%)
            </span>
        </div>
        
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-on-background leading-tight mb-8 max-w-4xl">
            "{result.claim}"
        </h1>
        
        <div className="flex items-center gap-4 text-on-surface-variant font-body text-sm mb-8">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">calendar_today</span> Analyzed {dateStr}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">source</span> {totalSources} Sources Queried</span>
        </div>

        <div className="flex gap-4">
            <button
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body text-sm font-semibold hover:bg-primary/90 transition-colors shadow-soft"
                onClick={onReset}
            >
                Verify Another Claim
            </button>
            {isAuthenticated ? (
                <button
                    className={`px-6 py-2 rounded-lg font-body text-sm font-semibold transition-colors border ${isSaved ? 'bg-surface-container-highest text-on-surface-variant border-outline-variant' : 'bg-surface text-primary border-primary hover:bg-primary/5'}`}
                    onClick={onSave}
                    disabled={isSaved}
                >
                    {isSaved ? '✓ Saved to History' : '📥 Save to History'}
                </button>
            ) : (
                <button
                    className="px-6 py-2 rounded-lg font-body text-sm font-semibold transition-colors border bg-surface text-primary border-primary hover:bg-primary/5"
                    onClick={onSignInRequired}
                >
                    📥 Save to History (Sign In)
                </button>
            )}
        </div>
      </section>

      {/* Detailed Breakdown Grid */}
      <section className="w-full relative">
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-12">
            <h2 className="font-headline text-3xl text-on-surface">Evidence Breakdown</h2>
            <p className="font-body text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">travel_explore</span> Explore the data
            </p>
        </div>

        {/* The interactive container */}
        <div className="relative w-full cursor-crosshair pb-12" id="evidence-container">
            
            <div className="pointer-events-none absolute hidden items-center justify-center w-16 h-16 bg-surface-container-low/60 border border-outline-variant/40 rounded-full backdrop-blur-md z-50 transition-transform duration-75 ease-out shadow-[0_4px_20px_rgba(58,48,42,0.08)]" id="mag-glass-follower">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>search_insights</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Card 1: Detailed Explanation */}
                <article className="col-span-1 lg:col-span-2 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-8 lg:p-12 hover:border-primary/30 transition-colors duration-500 shadow-[0_2px_16px_rgba(58,48,42,0.02)]">
                    <div className="flex justify-between items-start mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                        </div>
                        <span className="font-body text-xs font-bold text-primary tracking-wider uppercase bg-primary-fixed px-3 py-1 rounded-full">
                           {confidence > 80 ? 'High Confidence' : confidence > 50 ? 'Moderate Confidence' : 'Low Confidence'}
                        </span>
                    </div>
                    <h3 className="font-headline text-2xl text-on-surface mb-4">Contextual Analysis</h3>
                    <p className="font-body text-on-surface-variant leading-relaxed mb-6">
                        {result.verdict?.explanation}
                    </p>
                    <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${confidence}%` }}></div>
                    </div>
                    <p className="font-body text-xs text-secondary mt-3 text-right">{confidence}% Certainty Alignment</p>
                </article>

                {/* Card 2: Key Facts / Nuance */}
                <article className="col-span-1 bg-surface-container-low border border-outline-variant/60 rounded-2xl p-8 hover:border-primary/30 transition-colors duration-500 flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>balance</span>
                        </div>
                        <h3 className="font-headline text-xl text-on-surface mb-3">Key Facts & Nuance</h3>
                        <ul className="font-body text-sm text-on-surface-variant leading-relaxed mb-6 space-y-3">
                            {result.verdict?.keyFacts?.slice(0, 3).map((fact, idx) => (
                                <li key={idx} className="flex gap-2">
                                    <span className="text-primary">•</span> {fact}
                                </li>
                            )) || <li>No key facts extracted.</li>}
                        </ul>
                    </div>
                </article>

                {/* Card 3: Warnings (If any) */}
                {result.verdict?.warnings && result.verdict?.warnings.length > 0 && (
                    <article className="col-span-1 bg-error-container/30 border border-error/20 rounded-2xl p-8 hover:border-error/50 transition-colors duration-500">
                        <div className="mb-6">
                            <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>warning</span>
                        </div>
                        <h3 className="font-headline text-xl text-on-surface mb-3">Safety Warnings</h3>
                        <ul className="font-body text-sm text-on-surface-variant leading-relaxed space-y-2">
                            {result.verdict.warnings.map((warn, idx) => (
                                <li key={idx} className="text-on-error-container">{warn}</li>
                            ))}
                        </ul>
                    </article>
                )}

                {/* Card 4: Source Quality Matrix */}
                <article className={`bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-8 hover:border-primary/30 transition-colors duration-500 relative overflow-hidden group ${result.verdict?.warnings?.length > 0 ? 'col-span-1 md:col-span-2 lg:col-span-2' : 'col-span-1 md:col-span-2'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-transparent opacity-50 pointer-events-none"></div>
                    <h3 className="font-headline text-xl text-on-surface mb-6 relative z-10">Source Matrix</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div>
                            <p className="font-body text-xs text-secondary mb-1">PubMed Lit</p>
                            <p className="font-headline text-2xl text-on-surface">{pubmedList.length}</p>
                        </div>
                        <div>
                            <p className="font-body text-xs text-secondary mb-1">Clinical Trials</p>
                            <p className="font-headline text-2xl text-on-surface">{clinicalTrialsList.length}</p>
                        </div>
                        <div>
                            <p className="font-body text-xs text-secondary mb-1">WHO Data</p>
                            <p className="font-headline text-2xl text-on-surface">{whoSources.length}</p>
                        </div>
                        <div>
                            <p className="font-body text-xs text-secondary mb-1">FDA/ODPHP</p>
                            <p className="font-headline text-2xl text-on-surface">{fdaAlertsList.length + healthfinderSources.length}</p>
                        </div>
                    </div>
                </article>

            </div>
        </div>
      </section>

      {/* Raw Sources Lists */}
      {(pubmedList.length > 0 || clinicalTrialsList.length > 0) && (
        <section className="w-full max-w-6xl mt-12 pb-24">
            <h2 className="font-headline text-2xl text-on-surface mb-8 border-b border-outline-variant/60 pb-2">Academic Literature</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pubmedList.slice(0,4).map((paper, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 hover:border-primary/30 transition-colors">
                        <div className="font-body text-xs text-secondary mb-2">📅 {paper.year} · {paper.journal}</div>
                        <h4 className="font-headline text-lg text-on-surface mb-2 leading-snug">{paper.title}</h4>
                        <div className="font-body text-sm text-on-surface-variant mb-4 line-clamp-2">By {paper.authors}</div>
                        {paper.url && <a href={paper.url} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-primary hover:underline">View on PubMed ↗</a>}
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* Extracted Text (Optional) */}
      {result.ocrExtracted && (
          <div className="w-full max-w-3xl mx-auto mb-24 bg-surface-container-low rounded-xl p-6 border border-outline-variant/40">
              <h4 className="font-headline text-lg text-on-surface mb-2">OCR Extracted Text</h4>
              <p className="font-body text-sm text-on-surface-variant whitespace-pre-wrap">{result.ocrExtracted}</p>
          </div>
      )}

    </div>
  );
}
