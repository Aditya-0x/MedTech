import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';

const VERDICT_PILLS = {
  TRUE: { label: 'TRUE', color: 'var(--verdict-true)', bg: 'var(--verdict-true-bg)' },
  FALSE: { label: 'FALSE', color: 'var(--verdict-false)', bg: 'var(--verdict-false-bg)' },
  MISLEADING: { label: 'MISLEADING', color: 'var(--verdict-misleading)', bg: 'var(--verdict-misleading-bg)' },
  UNVERIFIED: { label: 'UNVERIFIED', color: 'var(--verdict-unverified)', bg: 'var(--verdict-unverified-bg)' }
};

export default function Dashboard({ userToken, onSelectReport, onNavigateToVerify }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load search history');
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchHistory();
    }
  }, [userToken]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Avoid triggering card click
    
    // Optimistic UI update
    const previousHistory = [...history];
    setHistory(history.filter(item => item.id !== id));

    try {
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete entry');
    } catch (err) {
      console.error(err);
      // Revert if API failed
      setHistory(previousHistory);
      alert(`Could not remove report: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Synchronizing clinical history...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Clinical History</h2>
          <p className={styles.subtitle}>Review, analyze, and manage your past medical claims verifications</p>
        </div>
        <button 
          className={styles.refreshBtn} 
          onClick={fetchHistory}
          title="Refresh history"
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

      {history.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧪</div>
          <h3 className={styles.emptyTitle}>No verified claims in your history</h3>
          <p className={styles.emptyText}>
            Begin testing medical and nutritional claims using our parallel Deep-Science Synthesis engines.
          </p>
          <button 
            type="button" 
            className={styles.actionBtn}
            onClick={onNavigateToVerify}
          >
            Verify a Claim Now →
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {history.map((item) => {
            const verdict = item.verdict?.verdict || 'UNVERIFIED';
            const pill = VERDICT_PILLS[verdict] || VERDICT_PILLS.UNVERIFIED;
            const confidence = item.verdict?.confidence || 0;
            const savedDate = new Date(item.savedAt || Date.now());

            return (
              <div 
                key={item.id} 
                className={styles.card}
                onClick={() => onSelectReport(item)}
              >
                {/* Refraction highlight edge */}
                <div className={styles.cardRefraction} />

                <div className={styles.cardHead}>
                  <span 
                    className={styles.verdictPill} 
                    style={{ color: pill.color, backgroundColor: pill.bg }}
                  >
                    {pill.label}
                  </span>
                  <span className={styles.confidenceScore} style={{ color: pill.color }}>
                    {confidence}% Conf.
                  </span>
                </div>

                <h3 className={styles.cardClaim}>
                  "{item.claim?.length > 120 ? item.claim.slice(0, 120) + '...' : item.claim}"
                </h3>

                <p className={styles.cardHeadline}>
                  {item.verdict?.headline}
                </p>

                <div className={styles.cardFoot}>
                  <span className={styles.timestamp}>
                    📅 {savedDate.toLocaleDateString()} at {savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, item.id)}
                    title="Remove from clinical history"
                    id={`delete-history-${item.id}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
