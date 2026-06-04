"use client";

import React, { useState } from 'react';
import { adminStyles } from '../cms/page';

export default function IngestionQueuesView() {
  const [sources, setSources] = useState([
    { id: '1', name: 'TechCrunch Feed', type: 'rss', status: 'active', lastRun: '10 mins ago' },
    { id: '2', name: 'Amazon Deals Scraper', type: 'scraping_api', status: 'paused', lastRun: '2 hours ago' }
  ]);

  const toggleStatus = (id: string) => {
    setSources(sources.map(s => 
      s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
    ));
  };

  return (
    <div style={adminStyles.container}>
      <h1 style={adminStyles.title}>Ingestion Source Queues</h1>
      <p style={adminStyles.subtitle}>Manage automated data pipelines and scraping triggers.</p>
      
      <div style={adminStyles.grid}>
        {sources.map(source => (
          <div key={source.id} className="glass-container" style={adminStyles.card}>
            <h3>{source.name}</h3>
            <p style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Type: {source.type}</p>
            <p style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Last Run: {source.lastRun}</p>
            <div style={{...adminStyles.actions, marginTop: '24px'}}>
              <button 
                style={source.status === 'active' ? adminStyles.rejectBtn : adminStyles.approveBtn} 
                onClick={() => toggleStatus(source.id)}
              >
                {source.status === 'active' ? 'Pause Source' : 'Enable Source'}
              </button>
            </div>
          </div>
        ))}
        
        <div className="glass-container" style={{...adminStyles.card, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed'}}>
          <h3 style={{color: 'var(--text-secondary)'}}>+ Add New Source</h3>
        </div>
      </div>
    </div>
  );
}
