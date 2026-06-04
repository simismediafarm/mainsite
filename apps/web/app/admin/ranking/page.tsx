"use client";

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../adminStyles';
import { API_BASE } from '../../../lib/kernel-api';

export default function RankingConfigurationsView() {
  const [weights, setWeights] = useState({
    freshness: 1.0,
    authority: 1.0,
    ctr: 1.0,
    monetization: 1.0
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/v2/admin/ranking/weights`)
      .then(res => res.json())
      .then(data => {
        if (data.weights) setWeights(data.weights);
      })
      .catch(console.error);
  }, []);

  const handleSave = () => {
    fetch(`${API_BASE}/api/v2/admin/ranking/weights`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights)
    }).then(() => alert('Ranking weights saved successfully.'));
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Ranking Engine Weights</h1>
      <p style={adminStyles.subtitle}>Adjust multipliers to control feed prioritization.</p>
      
      <div style={{...adminStyles.card, maxWidth: '500px'}} className="glass-container">
        {Object.entries(weights).map(([key, val]) => (
          <div key={key} style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px'}}>
            <label style={{textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between'}}>
              <span>{key} Multiplier</span>
              <span style={{color: 'var(--deal-green)', fontWeight: 'bold'}}>{val.toFixed(2)}x</span>
            </label>
            <input 
              type="range" 
              min="0" max="3" step="0.1" 
              value={val}
              onChange={(e) => setWeights({...weights, [key]: parseFloat(e.target.value)})}
              style={{width: '100%'}}
            />
          </div>
        ))}
        
        <button style={{...adminStyles.approveBtn, marginTop: '24px'}} onClick={handleSave}>
          Apply Changes Globally
        </button>
      </div>
    </div>
  );
}
