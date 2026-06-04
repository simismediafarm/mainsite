"use client";

import React, { useState, useEffect } from 'react';

export default function NewsletterModal() {
  const [showNewsletter, setShowNewsletter] = useState(false);

  useEffect(() => {
    // Show newsletter modal after 5 seconds
    const timer = setTimeout(() => setShowNewsletter(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!showNewsletter) return null;

  return (
    <div style={homeStyles.newsletterModal}>
      <div className="glass-container" style={homeStyles.newsletterContent}>
        <button style={homeStyles.closeBtn} onClick={() => setShowNewsletter(false)}>✕</button>
        <h3 style={{marginTop: 0}}>Never Miss a Tech Deal!</h3>
        <p style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Get curated programmatic price drops and AI-summarized tech reviews directly to your inbox.</p>
        <form style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
          <input type="email" placeholder="Your best email" style={homeStyles.input} required />
          <button type="submit" style={homeStyles.submitBtn}>Subscribe</button>
        </form>
      </div>
    </div>
  );
}

const homeStyles: Record<string, React.CSSProperties> = {
  newsletterModal: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '340px',
    zIndex: 1000,
    animation: 'slideUp 0.3s ease-out',
  },
  newsletterContent: {
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    position: 'relative',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '16px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)',
    background: 'var(--background)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  submitBtn: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
