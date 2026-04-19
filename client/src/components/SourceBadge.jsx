import React from 'react';
import styles from './SourceBadge.module.css';

const SOURCE_CONFIG = {
  'WHO GHO': {
    label: 'WHO GHO',
    icon: '🌐',
    color: '#00e5cc',
    bg: 'rgba(0, 229, 204, 0.08)',
    border: 'rgba(0, 229, 204, 0.18)',
    link: 'https://www.who.int/data/gho'
  },
  'MyHealthfinder': {
    label: 'MyHealthfinder',
    icon: '🏥',
    color: '#b388ff',
    bg: 'rgba(179, 136, 255, 0.08)',
    border: 'rgba(179, 136, 255, 0.18)',
    link: 'https://odphp.health.gov/myhealthfinder'
  },
  'Gemini 2.0 Flash': {
    label: 'Gemini AI',
    icon: '🤖',
    color: '#5df5c0',
    bg: 'rgba(93, 245, 192, 0.08)',
    border: 'rgba(93, 245, 192, 0.18)',
    link: 'https://ai.google.dev'
  },
  'Mistral OCR': {
    label: 'Mistral OCR',
    icon: '👁',
    color: '#ffab40',
    bg: 'rgba(255, 171, 64, 0.08)',
    border: 'rgba(255, 171, 64, 0.18)',
    link: 'https://mistral.ai'
  }
};

export default function SourceBadge({ type, showLink = false }) {
  const config = SOURCE_CONFIG[type] || {
    label: type, icon: '📄',
    color: '#8b9ab8', bg: 'rgba(139,154,184,0.1)', border: 'rgba(139,154,184,0.2)'
  };

  return (
    <span
      className={styles.badge}
      style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
      title={`Data source: ${config.label}`}
    >
      <span className={styles.icon}>{config.icon}</span>
      {config.label}
    </span>
  );
}
