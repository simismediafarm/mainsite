import React from 'react';
import { legalStyles } from '../legalStyles';

export default function PrivacyPage() {
  return (
    <div style={legalStyles.container}>
      <h1 style={legalStyles.title}>Privacy Policy</h1>
      <p style={legalStyles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div style={legalStyles.content}>
        <h2>1. Information We Collect</h2>
        <p>We may collect information you provide directly to us (e.g. newsletter signups), as well as automated data via cookies.</p>
        
        <h2>2. How We Use Information</h2>
        <p>Your information is used to improve our content ranking, provide personalized deals, and maintain a secure ecosystem.</p>
        
        <h2>3. GDPR & CCPA Compliance</h2>
        <p>If you reside in the EEA or California, you have the right to request deletion of your data. Please contact privacy@simismedia.com.</p>
      </div>
    </div>
  );
}
