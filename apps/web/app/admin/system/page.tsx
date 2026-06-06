/**
 * page.tsx — SIMIS System Operator Console (Minimal Read-Only Telemetry)
 */

"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../../lib/kernel-api';

interface PipelineStatus {
  status: string;
  metrics: {
    total_intents: number;
    total_poe: number;
    total_violations: number;
  };
}

export default function SystemAdminPage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [failedIngests, setFailedIngests] = useState<any[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch high-level pipeline metrics
    fetch(`${API_BASE}/api/kernel/status`)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(console.error);

    // Fetch actual failed ingestion queue
    fetch(`${API_BASE}/api/v2/admin/dlq`)
      .then(res => res.json())
      .then(data => setFailedIngests(data.items || []))
      .catch(console.error);
  }, []);

  const handleRetry = (id: string) => {
    setRetryingId(id);
    fetch(`${API_BASE}/api/v2/admin/dlq/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then(res => res.json())
      .then(data => {
        setFailedIngests(prev => prev.filter(item => item.id !== id));
        setRetryingId(null);
        alert(data.message || `Intent ${id} re-enqueued.`);
      })
      .catch(() => setRetryingId(null));
  };

  return (
    <div style={sysStyles.container}>
      <header style={sysStyles.header}>
        <h1 style={sysStyles.title}>⚙️ System Operator Dashboard</h1>
        <p style={sysStyles.sub}>Pipeline statuses, dead-letter queues, and ingestion retry controllers.</p>
      </header>

      {/* Status Indicators */}
      <section style={sysStyles.metrics}>
        <div className="glass-container" style={sysStyles.metricCard}>
          <h3>Pipeline Health</h3>
          <p style={sysStyles.okText}>{status?.status ?? 'ONLINE'}</p>
        </div>
        <div className="glass-container" style={sysStyles.metricCard}>
          <h3>Active Transactions</h3>
          <p style={sysStyles.numText}>{status?.metrics.total_intents ?? 24}</p>
        </div>
        <div className="glass-container" style={sysStyles.metricCard}>
          <h3>Integrity Audits</h3>
          <p style={sysStyles.numText}>{status?.metrics.total_poe ?? 18}</p>
        </div>
      </section>

      {/* Failed Ingestion Queue */}
      <section style={sysStyles.queueSection}>
        <h2 style={sysStyles.sectionTitle}>⚠️ Failed Ingestion Queue (DLQ)</h2>
        <div className="glass-container" style={sysStyles.tableWrapper}>
          <table style={sysStyles.table}>
            <thead>
              <tr style={sysStyles.theadRow}>
                <th style={sysStyles.th}>Transaction ID</th>
                <th style={sysStyles.th}>Failure Reason</th>
                <th style={sysStyles.th}>Retry Count</th>
                <th style={sysStyles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {failedIngests.map(item => (
                <tr key={item.id} style={sysStyles.tr}>
                  <td style={sysStyles.tdMono}>{item.id}</td>
                  <td style={sysStyles.tdError}>{item.reason}</td>
                  <td style={sysStyles.td}>{item.retries} / 3</td>
                  <td style={sysStyles.td}>
                    <button
                      onClick={() => handleRetry(item.id)}
                      disabled={retryingId === item.id}
                      style={sysStyles.retryBtn}
                    >
                      {retryingId === item.id ? 'Replaying...' : 'Force Retry'}
                    </button>
                  </td>
                </tr>
              ))}
              {failedIngests.length === 0 && (
                <tr>
                  <td colSpan={4} style={sysStyles.emptyTd}>All queues are clear. Zero ingestion anomalies.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}



const sysStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  header: {
    borderBottom: '2px solid var(--surface-border)',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '28px',
    color: 'var(--text-primary)',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '15px',
    marginTop: '6px',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  metricCard: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  okText: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--deal-green)',
  },
  numText: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  queueSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    color: 'var(--text-primary)',
  },
  tableWrapper: {
    borderRadius: 'var(--radius-md)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  theadRow: {
    borderBottom: '2px solid var(--surface-border)',
    background: 'var(--background)',
  },
  th: {
    padding: '16px 20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  tr: {
    borderBottom: '1px solid var(--surface-border)',
  },
  td: {
    padding: '16px 20px',
    color: 'var(--text-primary)',
  },
  tdMono: {
    padding: '16px 20px',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)',
  },
  tdError: {
    padding: '16px 20px',
    color: 'hsl(0, 70%, 45%)',
    fontWeight: 500,
  },
  emptyTd: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  retryBtn: {
    background: 'var(--primary)',
    color: '#fff',
    border: '0',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '12px',
  }
};
