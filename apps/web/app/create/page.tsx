'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import MarkdownRenderer from '../../components/MarkdownRenderer';

const AUTHORS = [
  { id: 'system-admin', name: 'Simis Admin' },
  { id: 'sarah-drasner', name: 'Sarah Drasner' },
  { id: 'alex-chen', name: 'Alex Chen' },
  { id: 'emma-watson', name: 'Emma Watson' },
];

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [authorId, setAuthorId] = useState('system-admin');
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 1. Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('simis_draft');
    if (savedDraft) {
      try {
        const { title: dTitle, content: dContent, tagsInput: dTags, authorId: dAuthor } = JSON.parse(savedDraft);
        if (dTitle) setTitle(dTitle);
        if (dContent) setContent(dContent);
        if (dTags) setTagsInput(dTags);
        if (dAuthor) setAuthorId(dAuthor);
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
  }, []);

  // 2. Autosave draft to localStorage on change
  useEffect(() => {
    const draft = { title, content, tagsInput, authorId };
    localStorage.setItem('simis_draft', JSON.stringify(draft));
  }, [title, content, tagsInput, authorId]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPublishing(true);
    // Parse comma-separated tags into an array
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const res = await fetch('/api/mvp/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          authorId,
          tags,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Clear draft
        localStorage.removeItem('simis_draft');
        // Redirect to the newly created post reader page
        router.push(`/post/${data.post.id}`);
      } else {
        const err = await res.json();
        alert(`Failed to publish: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Publishing error:', err);
      alert('An error occurred while publishing.');
    } finally {
      setIsPublishing(false);
    }
  };

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  const estReadingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="reader-container fade-in">
      <div style={styles.header}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Create a Story</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Drafts are automatically saved to your browser</p>
      </div>

      {/* Editor / Preview Switch Tab */}
      <div style={styles.tabRow}>
        <button 
          onClick={() => setIsPreview(false)} 
          style={{
            ...styles.tabBtn,
            borderBottomColor: !isPreview ? 'var(--primary-color)' : 'transparent',
            color: !isPreview ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          ✍️ Editor
        </button>
        <button 
          onClick={() => setIsPreview(true)} 
          style={{
            ...styles.tabBtn,
            borderBottomColor: isPreview ? 'var(--primary-color)' : 'transparent',
            color: isPreview ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <Eye size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} /> Live Preview
        </button>
      </div>

      {!isPreview ? (
        <form onSubmit={handlePublish} style={styles.form}>
          {/* Author Selector */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Publishing as:</label>
            <select 
              value={authorId} 
              onChange={(e) => setAuthorId(e.target.value)} 
              style={styles.select}
            >
              {AUTHORS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div style={styles.fieldGroup}>
            <input
              type="text"
              placeholder="Title of your story..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              style={styles.titleInput}
              required
            />
          </div>

          {/* Markdown Editor Textarea */}
          <div style={styles.fieldGroup}>
            <textarea
              placeholder="Tell your story. Supports markdown tags: # Headings, **bold**, *italic*, `code`, > quotes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-textarea"
              style={styles.textarea}
              required
            />
          </div>

          {/* Tag Input */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Tags (comma-separated):</label>
            <input
              type="text"
              placeholder="Engineering, Typography, Startups"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Editor Stats Footer */}
          <div style={styles.editorFooter}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {wordCount} words • {estReadingTime} min read
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
        /* Real-time Preview Pane */
        <div style={styles.previewContainer} className="glass-container">
          <header style={{ marginBottom: '24px' }}>
            <h1 className="article-title">{title || 'Untitled Story'}</h1>
            <div className="post-meta-row">
              <span className="author-name">
                {AUTHORS.find(a => a.id === authorId)?.name}
              </span>
              <span>•</span>
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
  header: {
    padding: '30px 0 10px 0',
  },
  tabRow: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '24px',
    gap: '20px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 12px 10px 12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  select: {
    padding: '10px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  titleInput: {
    fontSize: '28px',
    fontWeight: 800,
    border: 'none',
    borderBottom: '1px solid var(--border-color)',
    borderRadius: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  textarea: {
    minHeight: '300px',
    border: 'none',
    resize: 'vertical',
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: '18px',
    fontFamily: 'var(--font-serif)',
    lineHeight: '1.6',
  },
  editorFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
    marginTop: '20px',
  },
  previewContainer: {
    padding: '30px',
    borderRadius: '8px',
    minHeight: '350px',
  },
};
