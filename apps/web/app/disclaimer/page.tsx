import React from 'react';
import { legalStyles } from '../legalStyles';

export default function DisclaimerPage() {
  return (
    <div style={legalStyles.container}>
      <h1 style={legalStyles.title}>Affiliate Disclaimer</h1>
      <p style={legalStyles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div style={legalStyles.content}>
        <h2>FTC Disclosure</h2>
        <p>This website contains affiliate links. This means that if you click on a link and purchase an item, we may receive an affiliate commission at no extra cost to you.</p>
        
        <h2>Editorial Integrity</h2>
        <p>Our programmatic media engine ranks products based on data, user reviews, and pricing metrics. Affiliate partnerships do not override our primary ranking algorithms unless explicitly marked as &apos;Sponsored&apos;.</p>
      </div>
    </div>
  );
}
