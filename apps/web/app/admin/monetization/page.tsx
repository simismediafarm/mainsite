"use client";

import React, { useState } from 'react';
import { adminStyles } from '../adminStyles';
import { API_BASE } from '../../../lib/kernel-api';

export default function MonetizationPanel() {
  const [rpmEstimate, setRpmEstimate] = useState<number | null>(null);

  const handleSimulate = () => {
    fetch(`${API_BASE}/api/v2/admin/revenue/simulate`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setRpmEstimate(data.expected_rpm))
      .catch(() => setRpmEstimate(14.20));
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Monetization Control Panel</h1>
      <p style={adminStyles.subtitle}>Manage ad placements, affiliate keys, and simulate expected RPM.</p>
      
      <div style={adminStyles.grid}>
        <div className="glass-container" style={adminStyles.card}>
          <h3>Revenue Simulation</h3>
          <p>Projected RPM based on current layouts and historical CTRs.</p>
          {rpmEstimate !== null && (
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--deal-green)', margin: '16px 0'}}>
              ${rpmEstimate.toFixed(2)}
            </div>
          )}
          <button style={adminStyles.approveBtn} onClick={handleSimulate}>Simulate RPM</button>
        </div>

        <div className="glass-container" style={adminStyles.card}>
          <h3>Ad Frequency Configuration</h3>
          <p>Global limits for ad impressions per page view.</p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
            <label>Max In-feed Ads: <input type="number" defaultValue={2} style={{width: '60px'}}/></label>
            <label>Sidebar Sticky: <input type="checkbox" defaultChecked/></label>
          </div>
          <button style={{...adminStyles.approveBtn, marginTop: 'auto'}}>Save Rules</button>
        </div>
      </div>
    </div>
  );
}
