"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';

export default function NewsletterModal() {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowNewsletter(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      await apiClient.subscribeNewsletter(email);
      toast.success('Subscribed! Check your inbox.');
      setShowNewsletter(false);
    } catch {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showNewsletter) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Newsletter signup" style={homeStyles.newsletterModal}>
      <div className="glass-container" style={homeStyles.newsletterContent}>
        <button
          style={homeStyles.closeBtn}
          onClick={() => setShowNewsletter(false)}
          aria-label="Close newsletter modal"
        >
          ✕
        </button>
        <h3 style={{ marginTop: 0 }}>Never Miss a Tech Deal!</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Get curated programmatic price drops and AI-summarized tech reviews directly to your inbox.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }} noValidate>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Your best email"
              style={homeStyles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'newsletter-email-error' : undefined}
              disabled={loading}
            />
            <button type="submit" style={homeStyles.submitBtn} disabled={loading} aria-busy={loading}>
              {loading ? '...' : 'Subscribe'}
            </button>
          </div>
          {emailError && (
            <span id="newsletter-email-error" role="alert" style={{ color: 'hsl(0,70%,55%)', fontSize: '12px' }}>
              {emailError}
            </span>
          )}
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
  },
};
