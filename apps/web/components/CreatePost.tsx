'use client';

import React, { useState } from 'react';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await fetch('/api/mvp/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorId: 'guest-user', // Hardcoded for MVP simple flow
        }),
      });
      setContent('');
    } catch (err) {
      console.error('Failed to post', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form} className="glass-container">
      <textarea
        style={styles.textarea}
        placeholder="What's on your mind? Higher quality posts get higher trust scores..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
      />
      <div style={styles.footer}>
        <button type="submit" disabled={loading || !content.trim()} style={styles.button}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto 40px auto',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    background: 'var(--background)',
    border: '1px solid var(--surface-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px',
    color: 'var(--text-primary)',
    fontSize: '16px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
