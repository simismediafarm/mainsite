'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { apiClient } from '../lib/api-client';
import { env } from '../lib/env';

function useCurrentUserId(): string | null {
  const [userId, setUserId] = React.useState<string | null>(null);
  React.useEffect(() => {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  return userId;
}

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useCurrentUserId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      setError('Post content cannot be empty.');
      return;
    }
    if (trimmed.length < 10) {
      setError('Post must be at least 10 characters.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (!userId) {
        setError('You must be logged in to post.');
        return;
      }
      await apiClient.createPost({
        content: trimmed,
        authorId: userId,
      });
      setContent('');
      toast.success('Post published!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-container" style={styles.form}>
      <textarea
        style={styles.textarea}
        placeholder="What's on your mind? Higher quality posts get higher trust scores..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        aria-label="Post content"
        aria-required="true"
      />
      {error && (
        <p role="alert" style={styles.errorText}>{error}</p>
      )}
      <div style={styles.footer}>
        <span style={styles.charCount}>{content.length} chars</span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={styles.button}
          aria-busy={loading}
        >
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
  errorText: {
    color: 'hsl(0, 70%, 55%)',
    fontSize: '13px',
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
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
