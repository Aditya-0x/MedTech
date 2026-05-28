import React, { useState } from 'react';
import styles from './ResultCard.module.css';
import SourceBadge from './SourceBadge';

const VERDICT_CONFIG = {
  TRUE: {
    label: 'TRUE',
    emoji: '✅',
    color: '#5df5c0',
    bg: 'rgba(93, 245, 192, 0.06)',
    border: 'rgba(93, 245, 192, 0.2)',
    glow: 'rgba(93, 245, 192, 0.1)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5df5c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )
  },
  FALSE: {
    label: 'FALSE',
    emoji: '❌',
    color: '#ff6b8a',
    bg: 'rgba(255, 107, 138, 0.06)',
    border: 'rgba(255, 107, 138, 0.2)',
    glow: 'rgba(255, 107, 138, 0.1)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b8a" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    )
  },
  MISLEADING: {
    label: 'MISLEADING',
    emoji: '⚠️',
    color: '#ffcc02',
    bg: 'rgba(255, 204, 2, 0.06)',
    border: 'rgba(255, 204, 2, 0.2)',
    glow: 'rgba(255, 204, 2, 0.1)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffcc02" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
    )
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    emoji: '🔍',
    color: '#b388ff',
    bg: 'rgba(179, 136, 255, 0.06)',
    border: 'rgba(179, 136, 255, 0.2)',
    glow: 'rgba(179, 136, 255, 0.1)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b388ff" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    )
  }
};

export default function ResultCard({ result, onReset, isAuthenticated, isSaved, onSave, onSignInRequired }) {
  const [ocrExpanded, setOcrExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  if (!result) return null;

  const verdict = result.verdict?.verdict || 'UNVERIFIED';
  const vConfig = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.UNVERIFIED;
  const confidence = result.verdict?.confidence || 0;
  const whoSources = result.sources?.who || [];
  const healthfinderSources = result.sources?.healthfinder || [];

  const pubmedList = result.sources?.pubmed || result.verdict?.bibliography?.pubmed || [];
  const clinicalTrialsList = result.sources?.clinicalTrials || result.verdict?.bibliography?.clinicalTrials || [];
  const fdaAlertsList = result.sources?.fdaAlerts || result.verdict?.bibliography?.fdaAlerts || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.card} id="result-card">
      {/* ── Verdict Banner ── */}
      <div
        className={styles.verdictBanner}
        style={{ background: vConfig.bg, border: `1px solid ${vConfig.border}`, boxShadow: `0 0 40px ${vConfig.glow}` }}
      >
        <div className={styles.verdictLeft}>
          <div className={styles.verdictIconWrap} style={{ background: `${vConfig.color}20`, border: `1px solid ${vConfig.border}` }}>
            {vConfig.icon}
          </div>
          <div>
            <div className={styles.verdictLabel} style={{ color: vConfig.color }}>
              {vConfig.emoji} {vConfig.label}
            </div>
            <div className={styles.verdictHeadline}>
              {result.verdict?.headline || 'Analysis complete'}
            </div>
            
            {/* Action Banner buttons */}
            <div className={styles.bannerActions}>
              {isAuthenticated ? (
                <button
                  type="button"
                  className={`${styles.actionBtnMini} ${isSaved ? styles.actionBtnMiniSaved : ''}`}
                  onClick={onSave}
                  disabled={isSaved}
                  id="save-history-btn"
                >
                  {isSaved ? '✓ Saved to History' : '📥 Save to History'}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.actionBtnMini}
                  onClick={onSignInRequired}
                  id="save-history-guest-btn"
                >
                  📥 Save to History (Sign In)
                </button>
              )}
              <button 
                type="button" 
                className={styles.actionBtnMini} 
                onClick={handlePrint} 
                id="export-pdf-btn"
              >
                🖨️ Export PDF Report
              </button>
            </div>
          </div>
        </div>

        <div className={styles.confidenceBlock}>
          <div className={styles.confidenceNum} style={{ color: vConfig.color }}>
            {confidence}%
          </div>
          <div className={styles.confidenceLabel}>Confidence</div>
          <div className={styles.confidenceBar}>
            <div
              className={styles.confidenceBarFill}
              style={{
                width: `${confidence}%`,
                background: `linear-gradient(90deg, ${vConfig.color}, ${vConfig.color}99)`
              }}
            />
          </div>
        </div>
      </div>

      {/* ── OCR Extracted text (if image was used) ── */}
      {result.ocrExtracted && (
        <div className={styles.ocrSection}>
          <button
            className={styles.ocrToggle}
            onClick={() => setOcrExpanded(!ocrExpanded)}
            id="ocr-toggle-btn"
          >
            <span>👁 OCR Extracted Text</span>
            <span className={styles.ocrChevron} style={{ transform: ocrExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>
          {ocrExpanded && (
            <div className={styles.ocrContent}>
              <pre className={styles.ocrText}>{result.ocrExtracted}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── Source badges ── */}
      <div className={styles.sourceBadges}>
        <span className={styles.sourcesLabel}>Verified using:</span>
        {result.meta?.dataSourcesQueried?.map(s => (
          <SourceBadge key={s} type={s} />
        ))}
        {result.imageProvided && <SourceBadge type="Mistral OCR" />}
      </div>

      {/* ── Tab navigation ── */}
      <div className={styles.tabs}>
        {[
          { id: 'analysis', label: '📋 Clinical Synthesis' },
          { id: 'evidence', label: `🔬 Scientific Evidence (${pubmedList.length + clinicalTrialsList.length + fdaAlertsList.length})` },
          { id: 'sources', label: `📊 Public Health Databases (${whoSources.length + healthfinderSources.length})` },
          { id: 'related', label: '🔗 Related Topics' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={activeTab === tab.id ? { color: vConfig.color, borderColor: vConfig.color } : {}}
            id={`result-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Analysis tab ── */}
      {activeTab === 'analysis' && (
        <div className={`${styles.tabContent} animate-fade`}>
          {/* Warnings */}
          {result.verdict?.warnings?.length > 0 && (
            <div className={styles.warningBox}>
              <div className={styles.warningTitle}>⚠️ Safety Notice</div>
              {result.verdict.warnings.map((w, i) => (
                <p key={i} className={styles.warningText}>{w}</p>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Detailed Explanation</h3>
            <p className={styles.explanation}>{result.verdict?.explanation}</p>
          </div>

          {/* Key facts */}
          {result.verdict?.keyFacts?.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🔑 Key Facts</h3>
              <ul className={styles.factList}>
                {result.verdict.keyFacts.map((fact, i) => (
                  <li key={i} className={styles.factItem} style={{ borderLeftColor: vConfig.color }}>
                    <span className={styles.factNum} style={{ color: vConfig.color }}>{i + 1}</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Claim text */}
          <div className={styles.claimBox}>
            <div className={styles.claimLabel}>📌 Claim Analyzed</div>
            <p className={styles.claimText}>"{result.claim}"</p>
          </div>
        </div>
      )}

      {/* ── Scientific Evidence Base tab ── */}
      {activeTab === 'evidence' && (
        <div className={`${styles.tabContent} animate-fade`}>
          {/* PubMed peer-reviewed papers */}
          <div className={styles.scienceSection}>
            <div className={styles.scienceHeaderRow}>
              <h3 className={styles.scienceHeaderTitle}>📚 PubMed Peer-Reviewed Literature</h3>
            </div>
            {pubmedList.length > 0 ? (
              <div className={styles.academicGrid}>
                {pubmedList.map((paper, idx) => (
                  <div key={idx} className={styles.academicCard}>
                    <div>
                      <div className={styles.academicCardHead}>
                        <span className={styles.academicPubDate}>📅 {paper.year}</span>
                      </div>
                      <h4 className={styles.academicTitle}>{paper.title}</h4>
                      <div className={styles.academicAuthors}>By {paper.authors}</div>
                    </div>
                    <div>
                      <div className={styles.academicJournal}>{paper.journal}</div>
                      {paper.url && (
                        <a href={paper.url} target="_blank" rel="noopener noreferrer" className={styles.academicLink}>
                          View on PubMed ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noSources}>No peer-reviewed articles found directly matching this claim.</p>
            )}
          </div>

          {/* ClinicalTrials.gov Ongoing and Completed trials */}
          <div className={styles.scienceSection}>
            <div className={styles.scienceHeaderRow}>
              <h3 className={styles.scienceHeaderTitle}>🔬 ClinicalTrials.gov Studies</h3>
            </div>
            {clinicalTrialsList.length > 0 ? (
              <div className={styles.hfList}>
                {clinicalTrialsList.map((trial, idx) => (
                  <div key={idx} className={styles.trialCard}>
                    <div className={styles.trialHeader}>
                      <span className={styles.trialNct}>{trial.nctId}</span>
                      <div className={styles.trialBadges}>
                        <span className={styles.trialStatus}>{trial.status}</span>
                        <span className={styles.trialPhase}>{trial.phase}</span>
                      </div>
                    </div>
                    <h4 className={styles.trialTitle}>{trial.title}</h4>
                    {trial.conditions && trial.conditions.length > 0 && (
                      <div className={styles.trialConditions}>
                        {trial.conditions.map((cond, cIdx) => (
                          <span key={cIdx} className={styles.conditionPill}>{cond}</span>
                        ))}
                      </div>
                    )}
                    {trial.url && (
                      <a href={trial.url} target="_blank" rel="noopener noreferrer" className={styles.academicLink}>
                        View Registry Log ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noSources}>No registered clinical trial logs found matching this claim.</p>
            )}
          </div>

          {/* OpenFDA Recall Alerts */}
          <div className={styles.scienceSection}>
            <div className={styles.scienceHeaderRow}>
              <h3 className={styles.scienceHeaderTitle}>⚠️ OpenFDA Drug Alerts & Recalls</h3>
            </div>
            {fdaAlertsList.length > 0 ? (
              <div className={styles.hfList}>
                {fdaAlertsList.map((alert, idx) => (
                  <div key={idx} className={styles.fdaCard}>
                    <div className={styles.fdaHead}>
                      <span className={styles.fdaRecallNum}>{alert.recallNumber}</span>
                      <span className={styles.fdaClass}>{alert.classification || alert.status}</span>
                    </div>
                    <h4 className={styles.fdaProd}>{alert.productDescription}</h4>
                    <p className={styles.fdaReason}><strong>Reason for Recall:</strong> {alert.reasonForRecall}</p>
                    <div className={styles.fdaFirm}>🏢 Recalling Firm: {alert.recallingFirm}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noSources}>No active product recalls or safety alerts found for this claim's substances.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Sources tab ── */}
      {activeTab === 'sources' && (
        <div className={`${styles.tabContent} animate-fade`}>
          {whoSources.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🌐 WHO Global Health Observatory</h3>
              <div className={styles.sourceGrid}>
                {whoSources.map((s, i) => (
                  <div key={i} className={styles.sourceCard} style={{ borderTopColor: '#00e5cc' }}>
                    <div className={styles.sourceCardHeader}>
                      <SourceBadge type="WHO GHO" />
                      <span className={styles.sourceYear}>{s.year}</span>
                    </div>
                    <div className={styles.sourceName}>{s.name}</div>
                    <div className={styles.sourceValue} style={{ color: '#00e5cc' }}>
                      {s.value !== null && s.value !== undefined ? Number(s.value).toFixed(2) : 'N/A'}
                    </div>
                    <div className={styles.sourceCountry}>📍 {s.country}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {healthfinderSources.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🏥 MyHealthfinder (ODPHP / HHS)</h3>
              <div className={styles.hfList}>
                {healthfinderSources.map((s, i) => (
                  <div key={i} className={styles.hfCard} style={{ borderLeftColor: '#b388ff' }}>
                    <div className={styles.hfCardHead}>
                      <SourceBadge type="MyHealthfinder" />
                      <span className={styles.hfCategory}>{s.category}</span>
                    </div>
                    <div className={styles.hfTitle}>{s.title}</div>
                    {s.content && <p className={styles.hfContent}>{s.content}</p>}
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.hfLink}>
                        View full article →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {whoSources.length === 0 && healthfinderSources.length === 0 && (
            <div className={styles.noSources}>
              No directly matching data found in external APIs.
              The AI verdict is based on its medical knowledge base.
            </div>
          )}
        </div>
      )}

      {/* ── Related topics tab ── */}
      {activeTab === 'related' && (
        <div className={`${styles.tabContent} animate-fade`}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Related Medical Topics</h3>
            <div className={styles.relatedGrid}>
              {result.verdict?.relatedTopics?.map((topic, i) => (
                <div key={i} className={styles.relatedPill}>
                  <span className={styles.relatedNum} style={{ color: vConfig.color }}>{i + 1}</span>
                  {topic}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🔗 Authoritative Sources</h3>
            <div className={styles.officialLinks}>
              {[
                { name: 'WHO Global Health Observatory', url: 'https://www.who.int/data/gho', icon: '🌐' },
                { name: 'MyHealthfinder (HHS)', url: 'https://odphp.health.gov/myhealthfinder', icon: '🏥' },
                { name: 'PubMed Research', url: 'https://pubmed.ncbi.nlm.nih.gov', icon: '📚' },
                { name: 'CDC Health Topics', url: 'https://www.cdc.gov/az/a.html', icon: '🔬' }
              ].map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.officialLink}>
                  <span>{link.icon}</span>
                  <span>{link.name}</span>
                  <span className={styles.externalIcon}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Meta + Reset ── */}
      <div className={styles.footer}>
        <div className={styles.metaInfo}>
          ⚡ Verified in {(result.meta?.processingTimeMs / 1000).toFixed(1)}s ·
          {' '}{new Date(result.meta?.timestamp).toLocaleTimeString()}
        </div>
        <button
          id="verify-another-btn"
          className="btn-secondary"
          onClick={onReset}
        >
          ↺ Verify Another Claim
        </button>
      </div>

      <div className={styles.disclaimer}>
        ⚕️ <strong>Medical Disclaimer:</strong> This tool is for educational and research purposes only.
        Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
      </div>
    </div>
  );
}
