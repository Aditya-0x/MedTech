import React, { useEffect, useState } from 'react';

const VERDICT_PILLS = {
  TRUE: { label: 'TRUE', color: '#5df5c0', bg: 'rgba(93, 245, 192, 0.1)' },
  FALSE: { label: 'FALSE', color: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' },
  MISLEADING: { label: 'MISLEADING', color: '#ffcc02', bg: 'rgba(255, 204, 2, 0.1)' },
  UNVERIFIED: { label: 'UNVERIFIED', color: '#39ff14', bg: 'rgba(57, 255, 20, 0.1)' }
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
    e.stopPropagation();
    const previousHistory = [...history];
    setHistory(history.filter(item => item.id !== id));

    try {
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete entry');
    } catch (err) {
      console.error(err);
      setHistory(previousHistory);
      alert(`Could not remove report: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-32 min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="font-body text-on-surface-variant">Synchronizing clinical history...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <h2 className="font-headline text-4xl text-on-surface mb-2">Clinical History</h2>
          <p className="font-body text-on-surface-variant">Review, analyze, and manage your past medical claims verifications</p>
        </div>
        <button 
          className="flex items-center gap-2 font-body text-sm text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors border border-primary/20"
          onClick={fetchHistory}
          title="Refresh history"
        >
          <span className="material-symbols-outlined text-lg">sync</span>
          Sync Database
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 font-body flex items-center gap-3 border border-error/20">
            <span className="material-symbols-outlined text-error">warning</span> {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center text-4xl mb-6">
            <span className="material-symbols-outlined text-5xl">science</span>
          </div>
          <h3 className="font-headline text-2xl text-on-surface mb-3">No verified claims in your history</h3>
          <p className="font-body text-on-surface-variant mb-8 max-w-md">
            Begin testing medical and nutritional claims using our parallel Deep-Science Synthesis engines.
          </p>
          <button 
            type="button" 
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-body font-bold hover:bg-on-primary-fixed-variant transition-colors shadow-soft"
            onClick={onNavigateToVerify}
          >
            Verify a Claim Now →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => {
            const verdict = item.verdict?.verdict || 'UNVERIFIED';
            const pill = VERDICT_PILLS[verdict] || VERDICT_PILLS.UNVERIFIED;
            const confidence = item.verdict?.confidence || 0;
            const savedDate = new Date(item.savedAt || Date.now());

            return (
              <div 
                key={item.id} 
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 hover:border-primary/40 hover:shadow-float transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                onClick={() => onSelectReport(item)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
                
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span 
                      className="font-body text-xs font-bold tracking-wider px-3 py-1 rounded-full border" 
                      style={{ color: pill.color, backgroundColor: pill.bg, borderColor: `${pill.color}40` }}
                    >
                      {pill.label}
                    </span>
                    <span className="font-body text-xs font-semibold" style={{ color: pill.color }}>
                      {confidence}% Conf.
                    </span>
                  </div>

                  <h3 className="font-headline text-xl text-on-surface mb-3 leading-snug line-clamp-3">
                    "{item.claim}"
                  </h3>
                  
                  <p className="font-body text-sm text-on-surface-variant line-clamp-2">
                    {item.verdict?.headline}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant/30">
                  <span className="font-body text-xs text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span> 
                    {savedDate.toLocaleDateString()}
                  </span>
                  <button 
                    className="text-outline hover:text-error transition-colors p-2 rounded-full hover:bg-error-container/50"
                    onClick={(e) => handleDelete(e, item.id)}
                    title="Remove from history"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
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
