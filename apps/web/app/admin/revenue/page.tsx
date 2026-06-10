"use client";

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../adminStyles';
import { fetchKernelApi } from '../../../lib/kernel-api';

interface Metrics {
  system_health_status: string;
  queue_depth: { queued: number; completed: number; failed: number };
  llm_cost_burn_rate: number;
  recent_event_throughput: number;
}

export default function AdminRevenuePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [params, setParams] = useState({ ctr: 0.02, dwell: 15, geo: 'US' });
  const [rpmResult, setRpmResult] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchKernelApi('/api/admin/metrics')
      .then(setMetrics)
      .catch(() => {});
  }, []);

  const handleSimulate = () => {
    setSimulating(true);
    fetchKernelApi('/api/v2/admin/revenue/simulate', {
      method: 'POST',
      body: JSON.stringify({ ctr: params.ctr, dwell_time_seconds: params.dwell, geo: params.geo }),
    })
      .then(data => { setRpmResult(data.expected_rpm); setSimulating(false); })
      .catch(() => setSimulating(false));
  };

  const inputStyle: React.CSSProperties = {
    width: '70px', background: 'transparent', color: 'var(--text-primary)',
    border: '1px solid var(--surface-border)', borderRadius: '4px', padding: '2px 6px',
  };

  const kpiStyle: React.CSSProperties = {
    padding: '20px 24px', borderRadius: 'var(--radius-md)',
    display: 'flex', flexDirection: 'column', gap: '4px',
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Revenue Operations</h1>
      <p style={adminStyles.subtitle}>Yield optimization and monetization routing.</p>

      {/* System metrics strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Status</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: metrics?.system_health_status === 'OPTIMAL' ? 'var(--deal-green)' : 'orange' }}>
            {metrics?.system_health_status ?? '—'}
          </span>
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>LLM Cost/hr</span>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>
            {metrics != null ? `$${metrics.llm_cost_burn_rate.toFixed(2)}` : '—'}
          </span>
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Queue (queued)</span>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>{metrics?.queue_depth.queued ?? '—'}</span>
        </div>
        <div className="glass-container" style={kpiStyle}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Throughput (5m)</span>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>{metrics?.recent_event_throughput ?? '—'} events</span>
        </div>
      </div>

      {/* Revenue simulator */}
      <div style={adminStyles.grid}>
        <div className="glass-container" style={adminStyles.card}>
          <h3>RPM Simulator</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Projected revenue per mille based on signal inputs.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>CTR</span>
              <input type="number" step="0.01" min="0" max="1" value={params.ctr}
                onChange={e => setParams({ ...params, ctr: parseFloat(e.target.value) || 0 })}
                style={inputStyle} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Dwell (s)</span>
              <input type="number" min="0" value={params.dwell}
                onChange={e => setParams({ ...params, dwell: parseInt(e.target.value) || 0 })}
                style={inputStyle} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Geo</span>
              <select value={params.geo} onChange={e => setParams({ ...params, geo: e.target.value })}
                style={{ ...inputStyle, width: '70px' }}>
                <option value="US">US</option>
                <option value="UK">UK</option>
                <option value="ID">ID</option>
                <option value="SG">SG</option>
              </select>
            </label>
          </div>
          {rpmResult !== null && (
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--deal-green)', textAlign: 'center', margin: '8px 0' }}>
              ${rpmResult.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: 400 }}>RPM</span>
            </div>
          )}
          <button style={{ ...adminStyles.approveBtn, marginTop: 'auto' }} onClick={handleSimulate} disabled={simulating}>
            {simulating ? 'Simulating...' : 'Simulate RPM'}
          </button>
        </div>
      </div>
    </div>
  );
}
