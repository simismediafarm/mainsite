'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  status: string;
  author: { name: string; role: string };
  trustScore: number;
}

export default function ReviewQueue() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editorId, setEditorId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEditorId(data.user.id);
    });

    fetch('/api/mvp/feed')
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setPosts(data.posts.map((p: any) => ({ ...p, status: 'pending_review' })));
        }
      });
  }, []);

  const handleAction = async (postId: string, action: string) => {
    if (!editorId) {
      alert('Session expired. Please log in again.');
      return;
    }
    try {
      const res = await fetch(`/api/mvp/editorial/${action}/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: editorId }),
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        alert('Action failed. Unauthorized or invalid state.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Review Queue</h1>
        <nav>
          <Link href="/cms">&larr; Back to CMS</Link>
        </nav>
      </header>

      <div className="admin-content">
        {posts.length === 0 ? (
          <p>No posts pending review.</p>
        ) : (
          <div className="post-list">
            {posts.map(post => (
              <div key={post.id} className="admin-post-item" style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                <h3>{post.title}</h3>
                <p><strong>Author:</strong> {post.author?.name} ({post.author?.role})</p>
                <p><strong>Trust Score:</strong> {post.trustScore}</p>
                <p><strong>Status:</strong> <span style={{ color: 'orange' }}>{post.status}</span></p>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => handleAction(post.id, 'approve')} style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleAction(post.id, 'reject')} style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                  <button onClick={() => handleAction(post.id, 'feature')} style={{ background: '#8b5cf6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Feature</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
