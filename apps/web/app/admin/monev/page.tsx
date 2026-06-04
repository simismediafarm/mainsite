"use client";

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../adminStyles';

export default function ObservabilityMonitorView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Mock streaming of audit events / telemetry
    const interval = setInterval(() => {
      setLogs(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          action: 'SCRAPE_JOB_COMPLETED',
          target: 'TechCrunch Feed',
          status: 'Success'
        },
        ...prev
      ].slice(0, 15));
    }, 4000);
    
    return () => clearInterval(interval);
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
