import React from 'react';
import { legalStyles } from '../privacy/page';

export default function TermsPage() {
  return (
    <div style={legalStyles.container}>
      <h1 style={legalStyles.title}>Terms & Conditions</h1>
      <p style={legalStyles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div style={legalStyles.content}>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing this website, you agree to be bound by these Terms & Conditions and all applicable laws and regulations.</p>
        
        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>
        
        <h2>3. Limitations</h2>
        <p>In no event shall SIMIS Media or its suppliers be liable for any damages arising out of the use or inability to use the materials on the website.</p>
      </div>
    </div>
  );
}
