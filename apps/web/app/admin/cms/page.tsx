"use client";

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../lib/kernel-api';

export default function CmsCurationView() {
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    // Mock fetching editorial queue
    fetch(`${API_BASE}/api/v2/admin/content/queue`)
      .then(res => res.json())
      .then(data => setDrafts(data.items || []))
      .catch(() => setDrafts([
        { id: '1', title: 'Pending Review: Sony XM6', score: 0.95, status: 'draft' },
        { id: '2', title: 'Pending Review: Apple iPad Air', score: 0.88, status: 'draft' }
      ]));
  }, []);

  const handleApprove = (id: string) => {
    fetch(`${API_BASE}/api/v2/admin/content/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] })
    }).then(() => {
      setDrafts(drafts.filter(d => d.id !== id));
      alert(`Approved content ${id}`);
    });
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>CMS Curation Queue</h1>
      <p style={adminStyles.subtitle}>Review drafts with vector similarity markers before publishing.</p>
      
      <div style={adminStyles.grid}>
        {drafts.map(draft => (
          <div key={draft.id} className="glass-container" style={adminStyles.card}>
            <h3>{draft.title}</h3>
            <p>Similarity Score: {draft.score}</p>
            <div style={adminStyles.actions}>
              <button style={adminStyles.approveBtn} onClick={() => handleApprove(draft.id)}>Approve & Publish</button>
              <button style={adminStyles.rejectBtn}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const adminStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '48px',
    color: 'var(--text-primary)',
  },
  title: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
  },
  approveBtn: {
    background: 'var(--deal-green)',
    color: '#000',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    background: 'var(--surface-border)',
    color: 'var(--text-primary)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  }
};
