"use client";

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../adminStyles';

import { API_BASE } from '../../../lib/kernel-api';

export default function ObservabilityMonitorView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    let sse: EventSource | null = null;

    async function initSSE() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        const { data: { session } } = await supabase.auth.getSession();
        
        const token = session?.access_token || '';
        sse = new EventSource(`${API_BASE}/api/kernel/stream?token=${token}`);
        
        sse.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.type === 'connected') return;
            setLogs(prev => [payload, ...prev].slice(0, 15));
          } catch (err) {}
        };
        
        sse.addEventListener('log', (e: any) => {
          try {
            const payload = JSON.parse(e.data);
            setLogs(prev => [payload, ...prev].slice(0, 15));
          } catch (err) {}
        });
      } catch (err) {
        console.error('Failed to initialize SSE telemetry stream', err);
      }
    }

    initSSE();

    return () => {
      if (sse) sse.close();
    };
  }, []);

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Observability & Audit Monitor</h1>
      <p style={adminStyles.subtitle}>Real-time trace flow checking for ingestions, kernel intents, and monetization bridges.</p>
      
      <div className="glass-container" style={{padding: '24px', borderRadius: 'var(--radius-md)'}}>
        <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--surface-border)'}}>
              <th style={{padding: '12px'}}>Time</th>
              <th style={{padding: '12px'}}>Action Event</th>
              <th style={{padding: '12px'}}>Target</th>
              <th style={{padding: '12px'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} style={{padding: '12px', textAlign: 'center'}}>Waiting for telemetry events...</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{borderBottom: '1px solid var(--surface-border)'}}>
                  <td style={{padding: '12px', color: 'var(--text-secondary)'}}>{log.timestamp}</td>
                  <td style={{padding: '12px', fontFamily: 'monospace'}}>{log.action}</td>
                  <td style={{padding: '12px'}}>{log.target}</td>
                  <td style={{padding: '12px', color: 'var(--deal-green)'}}>{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
