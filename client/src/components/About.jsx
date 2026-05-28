import React from 'react';
import styles from './About.module.css';

export default function About() {
  const stats = [
    { label: 'Authority Sources', val: '5+' },
    { label: 'PHI Scrub Rate', val: '100%' },
    { label: 'Response Latency', val: '< 1.8s' },
    { label: 'Interoperability Standard', val: 'FHIR R4' }
  ];

  return (
    <div className={`${styles.aboutContainer} animate-fade-up`}>
      {/* Refraction edge highlight */}
      <div className={styles.refractionEdge} />

      {/* ── Brand Section ── */}
      <section className={styles.brandHero}>
        <div className={styles.glowOverlay} />
        <span className={styles.metaBadge}>ℹ️ ABOUT MED-VERIFY PRO</span>
        <h1 className={styles.heroTitle}>
          Smarter Clinical <br />
          <span className={styles.gradientText}>Veracity Pipelines</span>
        </h1>
        <p className={styles.heroDesc}>
          Med-Verify Pro is a clinical fact-checking and synthesis network designed to neutralize medical misinformation in real time. We merge authoritative public health data, peer-reviewed indices, and generative reasoning to safeguard patient education and diagnostic integrity.
        </p>

        {/* Dynamic Stats Row */}
        <div className={styles.statsRow}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statValue}>{stat.val}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Creator Profile: Aditya Verma ── */}
      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Meet the Creator</h2>
        <div className={styles.profileCard}>
          <div className={styles.avatarCol}>
            <div className={styles.avatarGlow} />
            <img 
              src="/aditya.jpg" 
              alt="Aditya Verma" 
              className={styles.profileAvatar}
            />
          </div>
          <div className={styles.profileDetails}>
            <h3 className={styles.creatorName}>Aditya Verma</h3>
            <span className={styles.creatorRole}>Lead Full-Stack Developer & Clinical Tech Architect</span>
            <p className={styles.creatorBio}>
              Aditya Verma is a full-stack software engineer dedicated to building resilient, high-performance web systems. Driven by clinical technology standards, Aditya engineered Med-Verify Pro to provide responsive, secure evidence cross-referencing, bringing corporate-grade compliance and fluid glassmorphic UI design to public healthcare intelligence.
            </p>
            <div className={styles.badgeRow}>
              <span className={styles.profileBadge}>💻 Full-Stack Engineer</span>
              <span className={styles.profileBadge}>🔬 Clinical Informatics</span>
              <span className={styles.profileBadge}>🛡️ HIPAA Security Specialist</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Technical Infrastructure ── */}
      <section className={styles.infraSection}>
        <h2 className={styles.sectionTitle}>Technical Infrastructure</h2>
        <div className={styles.infraGrid}>
          <div className={styles.infraCard}>
            <div className={styles.infraIcon}>🌐</div>
            <h3 className={styles.infraTitle}>Parallel Data Fetching</h3>
            <p className={styles.infraDesc}>
              Queries 5 highly authoritative health databases (WHO Global Health Observatory, PubMed literature, ClinicalTrials.gov, MyHealthfinder, and OpenFDA alerts) simultaneously.
            </p>
          </div>
          <div className={styles.infraCard}>
            <div className={styles.infraIcon}>🛡️</div>
            <h3 className={styles.infraTitle}>HIPAA Zero-Data Retention</h3>
            <p className={styles.infraDesc}>
              Our Zero-Data-Retention (ZDR) scrubber intercepts all text queries, scrubbing Personal Health Information (PHI) before routing calls to public APIs, protecting user privacy.
            </p>
          </div>
          <div className={styles.infraCard}>
            <div className={styles.infraIcon}>⚡</div>
            <h3 className={styles.infraTitle}>Scientific Synthesis Engine</h3>
            <p className={styles.infraDesc}>
              Integrates deep clinical fact-checking pipelines with advanced semantic classification models to render highly authoritative medical, chemical, and nutritional claim verdicts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
