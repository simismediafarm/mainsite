"use client";

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../adminStyles';
import { fetchKernelApi } from '../../../lib/kernel-api';

interface Author {
  id: string;
  name: string;
  role?: string;
  bio?: string;
}

interface AuthorDetail extends Author {
  posts: { id: string; title: string; status: string; createdAt: string }[];
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selected, setSelected] = useState<AuthorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract unique authors from the feed
    fetchKernelApi('/api/mvp/feed')
      .then((data: any) => {
        const posts = data.posts || [];
        const seen = new Set<string>();
        const unique: Author[] = [];
        for (const post of posts) {
          if (post.author && !seen.has(post.author.id)) {
            seen.add(post.author.id);
            unique.push({ id: post.author.id, name: post.author.name, role: post.author.role, bio: post.author.bio });
          }
        }
        setAuthors(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadAuthor = (id: string) => {
    fetchKernelApi(`/api/mvp/author/${id}`)
      .then((data: any) => setSelected({ ...data.author, posts: data.posts || [] }))
      .catch(() => {});
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Author Network Factory</h1>
      <p style={adminStyles.subtitle}>Programmatic EEAT and author persona scaling.</p>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Author list */}
        <div style={adminStyles.grid}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading authors...</p>
          ) : authors.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No authors found in feed.</p>
          ) : (
            authors.map(author => (
              <div key={author.id} className="glass-container" style={{ ...adminStyles.card, cursor: 'pointer' }}
                onClick={() => loadAuthor(author.id)}>
                <h3 style={{ fontSize: '16px' }}>{author.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Role: {author.role ?? 'contributor'}</p>
                {author.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{author.bio}</p>}
                <span style={{ fontSize: '12px', color: 'var(--deal-green)', marginTop: 'auto' }}>View →</span>
              </div>
            ))
          )}
        </div>

        {/* Author detail panel */}
        {selected && (
          <div className="glass-container" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px' }}>{selected.name}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selected.role}</p>
              </div>
              <button style={adminStyles.rejectBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            {selected.bio && <p style={{ fontSize: '14px', marginBottom: '16px' }}>{selected.bio}</p>}
            <h4 style={{ marginBottom: '8px' }}>Posts ({selected.posts.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {selected.posts.map(post => (
                <div key={post.id} style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '14px' }}>{post.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{post.status} · {new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
