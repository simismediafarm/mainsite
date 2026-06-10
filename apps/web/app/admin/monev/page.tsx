"use client";

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../adminStyles';
import { fetchKernelApi, API_BASE } from '../../../lib/kernel-api';

interface Metrics {
  system_health_status: string;
  queue_depth: { queued: number; completed: number; failed: number };
  llm_cost_burn_rate: number;
  fallback_frequency: number;
  recent_event_throughput: number;
  last_updated: string;
}

export default function ObservabilityMonitorView() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchKernelApi('/api/admin/metrics')
      .then(setMetrics)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let abortController: AbortController | null = null;

    async function initSSE() {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        abortController = new AbortController();
        const response = await fetch(`${API_BASE}/api/kernel/stream`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: abortController.signal,
        });
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          for (const chunk of lines) {
            const dataLine = chunk.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(5).trim());
              if (payload.type === 'connected') continue;
              setLogs(prev => [payload, ...prev].slice(0, 15));
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('SSE error', err);
      }
    }

    initSSE();
    return () => abortController?.abort();
  }, []);

  const kpiStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Observability & Audit Monitor</h1>
      <p style={adminStyles.subtitle}>Real-time trace flow and system health metrics.</p>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Status</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: metrics?.system_health_status === 'OPTIMAL' ? 'var(--deal-green)' : 'orange' }}>
            {metrics?.system_health_status ?? '—'}
          </span>
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Queue Depth</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>{metrics ? `${metrics.queue_depth.queued} queued` : '—'}</span>
          {metrics && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{metrics.queue_depth.completed} done · {metrics.queue_depth.failed} failed</span>}
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>LLM Cost/hr</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>{metrics != null ? `$${metrics.llm_cost_burn_rate.toFixed(2)}` : '—'}</span>
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fallback Rate</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>{metrics != null ? `${(metrics.fallback_frequency * 100).toFixed(1)}%` : '—'}</span>
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Throughput (5m)</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>{metrics?.recent_event_throughput ?? '—'} events</span>
        </div>
      </div>

      {/* SSE Event Stream */}
      <div className="glass-container" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ marginBottom: '16px' }}>Live Event Stream</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '12px' }}>Time</th>
              <th style={{ padding: '12px' }}>Action Event</th>
              <th style={{ padding: '12px' }}>Target</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Waiting for telemetry events...</td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={log.id ?? i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{log.timestamp}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{log.action}</td>
                  <td style={{ padding: '12px' }}>{log.target}</td>
                  <td style={{ padding: '12px', color: 'var(--deal-green)' }}>{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
