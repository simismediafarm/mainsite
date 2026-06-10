'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { fetchKernelApi } from '../../lib/kernel-api';

export default function CreatePostPage() {
  const router = useRouter();
  const [sessionAuthor, setSessionAuthor] = useState<{ id: string; name: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Get authorId from Supabase session — the only secure source of truth
  useEffect(() => {
    const { createBrowserClient } = require('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      if (data?.user) {
        setSessionAuthor({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email || 'Anonymous',
        });
      }
      setSessionLoading(false);
    });
  }, []);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('simis_draft');
      if (saved) {
        const { title: t, content: ct, tagsInput: tg } = JSON.parse(saved);
        if (t) setTitle(t);
        if (ct) setContent(ct);
        if (tg) setTagsInput(tg);
      }
    } catch {}
  }, []);

  // Autosave draft (exclude authorId — always from session)
  useEffect(() => {
    localStorage.setItem('simis_draft', JSON.stringify({ title, content, tagsInput }));
  }, [title, content, tagsInput]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !sessionAuthor?.id) return;

    setIsPublishing(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const data = await fetchKernelApi('/api/mvp/post', {
        method: 'POST',
        body: JSON.stringify({ title, content, authorId: sessionAuthor.id, tags }),
      });
      localStorage.removeItem('simis_draft');
      router.push(`/post/${data.post.id}`);
    } catch (err: any) {
      alert(`Failed to publish: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  const estReadingTime = Math.max(1, Math.round(wordCount / 200));

  if (sessionLoading) {
    return (
      <div className="reader-container" style={{ paddingTop: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading session...
      </div>
    );
  }

  if (!sessionAuthor) {
    return (
      <div className="reader-container" style={{ paddingTop: 60, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>You must be signed in to create a post.</p>
        <a href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="reader-container fade-in">
      <div style={styles.header}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Create a Story</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Publishing as <strong style={{ color: 'var(--text-primary)' }}>{sessionAuthor.name}</strong>
          {' · '}Drafts auto-saved
        </p>
      </div>

      <div style={styles.tabRow}>
        <button
          onClick={() => setIsPreview(false)}
          style={{ ...styles.tabBtn, borderBottomColor: !isPreview ? 'var(--primary-color)' : 'transparent', color: !isPreview ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          ✍️ Editor
        </button>
        <button
          onClick={() => setIsPreview(true)}
          style={{ ...styles.tabBtn, borderBottomColor: isPreview ? 'var(--primary-color)' : 'transparent', color: isPreview ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          <Eye size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} /> Live Preview
        </button>
      </div>

      {!isPreview ? (
        <form onSubmit={handlePublish} style={styles.form}>
          <div style={styles.fieldGroup}>
            <input
              type="text"
              placeholder="Title of your story..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
              style={styles.titleInput}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <textarea
              placeholder="Tell your story. Supports markdown: # Headings, **bold**, *italic*, `code`, > quotes..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="form-textarea"
              style={styles.textarea}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Tags (comma-separated):</label>
            <input
              type="text"
              placeholder="Engineering, Startups, AI"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={styles.editorFooter}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {wordCount} words · {estReadingTime} min read
            </span>
            <button
              type="submit"
              disabled={isPublishing || !title.trim() || !content.trim()}
              className="btn btn-primary"
            >
              {isPublishing ? 'Publishing...' : 'Publish story'}
            </button>
          </div>
        </form>
      ) : (
        <div style={styles.previewContainer} className="glass-container">
          <header style={{ marginBottom: '24px' }}>
            <h1 className="article-title">{title || 'Untitled Story'}</h1>
            <div className="post-meta-row">
              <span className="author-name">{sessionAuthor.name}</span>
              <span>·</span>
              <span>{estReadingTime} min read</span>
            </div>
          </header>
          <MarkdownRenderer content={content || '*Write something to preview...*'} />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { padding: '30px 0 10px 0' },
  tabRow: { display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', gap: '20px' },
  tabBtn: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '8px 12px 10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' },
  titleInput: { fontSize: '28px', fontWeight: 800, border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, paddingLeft: 0, paddingRight: 0 },
  textarea: { minHeight: '300px', border: 'none', resize: 'vertical', paddingLeft: 0, paddingRight: 0, fontSize: '18px', fontFamily: 'var(--font-serif)', lineHeight: '1.6' },
  editorFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' },
  previewContainer: { padding: '30px', borderRadius: '8px', minHeight: '350px' },
};
