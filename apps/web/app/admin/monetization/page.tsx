"use client";

import { useState } from 'react';
import { adminStyles } from '../adminStyles';
import { fetchKernelApi } from '../../../lib/kernel-api';

export default function MonetizationPanel() {
  const [rpmEstimate, setRpmEstimate] = useState<number | null>(null);
  const [params, setParams] = useState({ ctr: 0.02, dwell: 15, geo: 'US' });

  const handleSimulate = () => {
    fetchKernelApi('/api/v2/admin/revenue/simulate', {
      method: 'POST',
      body: JSON.stringify({ ctr: params.ctr, dwell_time_seconds: params.dwell, geo: params.geo }),
    })
      .then(data => setRpmEstimate(data.expected_rpm))
      .catch(() => setRpmEstimate(null));
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Monetization Control Panel</h1>
      <p style={adminStyles.subtitle}>Manage ad placements, affiliate keys, and simulate expected RPM.</p>
      
      <div style={adminStyles.grid}>
        <div className="glass-container" style={adminStyles.card}>
          <h3>Revenue Simulation</h3>
          <p>Projected RPM based on inputs.</p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0'}}>
            <label style={{display: 'flex', justifyContent: 'space-between'}}>
              CTR (%): <input type="number" step="0.01" value={params.ctr} onChange={e => setParams({...params, ctr: parseFloat(e.target.value)})} style={{width: '60px', background: 'transparent', color: 'white', border: '1px solid gray'}}/>
            </label>
            <label style={{display: 'flex', justifyContent: 'space-between'}}>
              Dwell (s): <input type="number" value={params.dwell} onChange={e => setParams({...params, dwell: parseInt(e.target.value)})} style={{width: '60px', background: 'transparent', color: 'white', border: '1px solid gray'}}/>
            </label>
            <label style={{display: 'flex', justifyContent: 'space-between'}}>
              Geo: 
              <select value={params.geo} onChange={e => setParams({...params, geo: e.target.value})} style={{width: '60px', background: 'transparent', color: 'white', border: '1px solid gray'}}>
                <option value="US">US</option>
                <option value="UK">UK</option>
                <option value="ID">ID</option>
              </select>
            </label>
          </div>
          {rpmEstimate !== null && (
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--deal-green)', margin: '16px 0', textAlign: 'center'}}>
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
