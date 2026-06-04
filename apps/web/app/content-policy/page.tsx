import React from 'react';
import { legalStyles } from '../privacy/page';

export default function ContentPolicyPage() {
  return (
    <div style={legalStyles.container}>
      <h1 style={legalStyles.title}>Content Policy</h1>
      <p style={legalStyles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div style={legalStyles.content}>
        <h2>Programmatic Generation</h2>
        <p>A portion of our content is programmatically generated or AI-assisted using deterministic data scraping to provide accurate, up-to-date specs and prices. All generated content passes through a human-supervised editorial pipeline.</p>
        
        <h2>Proof of Execution (PoE)</h2>
        <p>To ensure transparency, critical reviews and comparison blocks feature a PoE Cryptographic signature. This provides a verifiable trace of the data origin and timestamps.</p>
        
        <h2>Corrections</h2>
        <p>If you find any inaccuracies in our tech specs or pricing grids, please report them to support@simismedia.com and our engine will re-evaluate the source data.</p>
      </div>
    </div>
  );
}
