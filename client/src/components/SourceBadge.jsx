import React from 'react';

const SOURCE_CONFIG = {
  'WHO GHO': {
    label: 'WHO GHO',
    icon: '🌐',
    color: '#00ffef',
    bg: 'rgba(0, 255, 239, 0.08)',
    border: 'rgba(0, 255, 239, 0.18)'
  },
  'MyHealthfinder': {
    label: 'MyHealthfinder',
    icon: '🏥',
    color: '#39ff14',
    bg: 'rgba(57, 255, 20, 0.08)',
    border: 'rgba(57, 255, 20, 0.18)'
  },
  'Gemini 2.0 Flash': {
    label: 'Gemini AI',
    icon: '🤖',
    color: '#5df5c0',
    bg: 'rgba(93, 245, 192, 0.08)',
    border: 'rgba(93, 245, 192, 0.18)'
  },
  'Mistral OCR': {
    label: 'Mistral OCR',
    icon: '👁',
    color: '#ffab40',
    bg: 'rgba(255, 171, 64, 0.08)',
    border: 'rgba(255, 171, 64, 0.18)'
  }
};

export default function SourceBadge({ type, showLink = false }) {
  let config = SOURCE_CONFIG[type];

  if (type && type.toLowerCase().includes('pubmed')) {
    config = { label: 'PubMed Literature', icon: '📚', color: '#39ff14', bg: 'rgba(57, 255, 20, 0.08)', border: 'rgba(57, 255, 20, 0.18)' };
  } else if (type && type.toLowerCase().includes('clinicaltrials')) {
    config = { label: 'ClinicalTrials.gov', icon: '🔬', color: '#ff80ab', bg: 'rgba(255, 128, 171, 0.08)', border: 'rgba(255, 128, 171, 0.18)' };
  } else if (type && type.toLowerCase().includes('openfda')) {
    config = { label: 'OpenFDA Alerts', icon: '⚠️', color: '#ffab40', bg: 'rgba(255, 171, 64, 0.08)', border: 'rgba(255, 171, 64, 0.18)' };
  } else if (type && type.toLowerCase().includes('who')) {
    config = { label: 'WHO GHO', icon: '🌐', color: '#00ffef', bg: 'rgba(0, 255, 239, 0.08)', border: 'rgba(0, 255, 239, 0.18)' };
  } else if (type && (type.toLowerCase().includes('healthfinder') || type.toLowerCase().includes('odphp'))) {
    config = { label: 'MyHealthfinder', icon: '🏥', color: '#39ff14', bg: 'rgba(57, 255, 20, 0.08)', border: 'rgba(57, 255, 20, 0.18)' };
  } else if (type && type.toLowerCase().includes('gemini')) {
    const prettyLabel = type.replace(/gemini/i, 'Gemini').split('-').map(word => {
        const lower = word.toLowerCase();
        if (lower === 'gemini') return 'Gemini';
        if (lower === 'flash') return 'Flash';
        if (lower === 'pro') return 'Pro';
        if (lower === 'lite') return 'Lite';
        return word;
    }).join(' ');
    config = { label: prettyLabel, icon: '🤖', color: '#5df5c0', bg: 'rgba(93, 245, 192, 0.08)', border: 'rgba(93, 245, 192, 0.18)' };
  }

  if (!config) {
    config = { label: type, icon: '📄', color: '#8b9ab8', bg: 'rgba(139,154,184,0.1)', border: 'rgba(139,154,184,0.2)' };
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs whitespace-nowrap m-1"
      style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
      title={`Data source: ${config.label}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
