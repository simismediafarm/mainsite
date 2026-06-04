import React from 'react';

export const legalStyles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '48px 24px',
    color: 'var(--text-primary)',
  },
  title: {
    fontSize: '36px',
    marginBottom: '8px',
  },
  lastUpdated: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '32px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    lineHeight: '1.7',
    fontSize: '16px',
  }
};
