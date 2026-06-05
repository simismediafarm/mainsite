'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEventSourceFeed } from '../../../lib/sse';

interface Post {
  id: string;
  title: string;
  views: number;
  clicks: number;
  ctr: number;
  rpmEstimate: number;
  totalRevenue: number;
  adSlotsFilled: number;
}

export default function RevenueDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/mvp/feed')
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setPosts(data.posts);
        }
      });
  }, []);

  // Listen for RPM updates
  useEventSourceFeed((event) => {
    if (event.type === 'rpm_updated') {
      const payload = event.payload as any;
      setPosts(prev => prev.map(p => 
        p.id === payload.id 
          ? { ...p, rpmEstimate: payload.rpmEstimate, totalRevenue: payload.totalRevenue, ctr: payload.ctr || p.ctr }
          : p
      ));
    }
  });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Revenue & RPM Hub</h1>
        <nav>
          <Link href="/ads">&larr; Ads Overview</Link>
          <Link href="/cms">CMS</Link>
        </nav>
      </header>

      <div className="admin-content">
        <h2>Live Post Revenue Performance</h2>
        <div className="post-list">
          {posts.map(post => (
            <div key={post.id} className="admin-post-item" style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
              <h3>{post.title}</h3>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Views</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{post.views || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Clicks</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{post.clicks || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>CTR</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(post.ctr || 0) * 100}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>RPM (Est)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>${post.rpmEstimate || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Total Revenue</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>${(post.totalRevenue || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
