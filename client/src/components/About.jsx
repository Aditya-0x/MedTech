import React from 'react';

export default function About() {
  const stats = [
    { label: 'Authority Sources', val: '5+' },
    { label: 'PHI Scrub Rate', val: '100%' },
    { label: 'Response Latency', val: '< 1.8s' },
    { label: 'Interoperability Standard', val: 'FHIR R4' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16 animate-fade-in-up">
      {/* ── Brand Section ── */}
      <section className="relative bg-surface-container-low border border-outline-variant/60 rounded-3xl p-12 lg:p-20 overflow-hidden mb-16 shadow-soft text-center md:text-left flex flex-col items-center md:items-start">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-container rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />
        
        <div className="inline-block bg-secondary-container/50 text-on-secondary-container px-4 py-1.5 rounded-full font-body text-xs font-bold tracking-widest uppercase mb-8 border border-secondary/20 relative z-10">
          ℹ️ ABOUT MED-VERIFY PRO
        </div>
        
        <h1 className="font-headline text-5xl md:text-7xl text-on-surface mb-8 leading-tight relative z-10">
          Smarter Clinical <br className="hidden md:block" />
          <span className="text-primary italic">Veracity Pipelines</span>
        </h1>
        
        <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-3xl leading-relaxed mb-16 font-light relative z-10">
          Med-Verify Pro is a clinical fact-checking and synthesis network designed to neutralize medical misinformation in real time. We merge authoritative public health data, peer-reviewed indices, and generative reasoning to safeguard patient education and diagnostic integrity.
        </p>

        {/* Dynamic Stats Row */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-surface/60 backdrop-blur-sm border border-outline-variant/40 rounded-2xl p-6 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
              <div className="font-headline text-4xl text-primary mb-2">{stat.val}</div>
              <div className="font-body text-xs text-on-surface-variant uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Creator Profile ── */}
      <section className="mb-24">
        <h2 className="font-headline text-3xl text-on-surface mb-8 text-center uppercase tracking-widest">Meet the Creator</h2>
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 lg:p-12 shadow-soft flex flex-col md:flex-row items-center md:items-start gap-12 group hover:border-primary/30 transition-colors">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors" />
            <img 
              src="/aditya.jpg" 
              alt="Aditya Verma" 
              className="relative w-48 h-48 md:w-56 md:h-56 object-cover rounded-full border-4 border-surface shadow-float"
              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Aditya+Verma&background=C2652A&color=fff&size=256' }}
            />
          </div>
          <div className="flex-1 text-center md:text-left pt-2">
            <h3 className="font-headline text-4xl text-on-surface mb-2">Aditya Verma</h3>
            <span className="block font-body text-primary font-bold tracking-wider uppercase text-sm mb-6">Lead Full-Stack Developer & Clinical Tech Architect</span>
            <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-8">
              Aditya Verma is a full-stack software engineer dedicated to building resilient, high-performance web systems. Driven by clinical technology standards, Aditya engineered Med-Verify Pro to provide responsive, secure evidence cross-referencing, bringing corporate-grade compliance and fluid glassmorphic UI design to public healthcare intelligence.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg font-body text-sm font-semibold border border-outline-variant/40 shadow-sm">💻 Full-Stack Engineer</span>
              <span className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg font-body text-sm font-semibold border border-outline-variant/40 shadow-sm">🔬 Clinical Informatics</span>
              <span className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg font-body text-sm font-semibold border border-outline-variant/40 shadow-sm">🛡️ HIPAA Security Specialist</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Technical Infrastructure ── */}
      <section>
        <h2 className="font-headline text-3xl text-on-surface mb-8 text-center uppercase tracking-widest">Technical Infrastructure</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-8 hover:shadow-soft hover:bg-surface-container transition-all">
            <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center text-3xl mb-6 shadow-inner">🌐</div>
            <h3 className="font-headline text-2xl text-on-surface mb-4">Parallel Data Fetching</h3>
            <p className="font-body text-on-surface-variant leading-relaxed">
              Queries 5 highly authoritative health databases (WHO Global Health Observatory, PubMed literature, ClinicalTrials.gov, MyHealthfinder, and OpenFDA alerts) simultaneously.
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-8 hover:shadow-soft hover:bg-surface-container transition-all">
            <div className="w-14 h-14 bg-error-container text-on-error-container rounded-xl flex items-center justify-center text-3xl mb-6 shadow-inner">🛡️</div>
            <h3 className="font-headline text-2xl text-on-surface mb-4">HIPAA Zero-Data Retention</h3>
            <p className="font-body text-on-surface-variant leading-relaxed">
              Our Zero-Data-Retention (ZDR) scrubber intercepts all text queries, scrubbing Personal Health Information (PHI) before routing calls to public APIs, protecting user privacy.
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-8 hover:shadow-soft hover:bg-surface-container transition-all">
            <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center text-3xl mb-6 shadow-inner">⚡</div>
            <h3 className="font-headline text-2xl text-on-surface mb-4">Scientific Synthesis</h3>
            <p className="font-body text-on-surface-variant leading-relaxed">
              Integrates deep clinical fact-checking pipelines with advanced semantic classification models to render highly authoritative medical, chemical, and nutritional claim verdicts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
