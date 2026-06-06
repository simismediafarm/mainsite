'use client';

import React from 'react';

export default function IntegrationsHub() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">Integration Hub</h2>
        <p className="text-sm text-[#bac9cc] mt-1">Manage RSS, Webhooks, APIs and internal Data Pipelines.</p>
      </div>

      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
        <p className="text-[#bac9cc] text-sm">Integration module loads via registry...</p>
      </div>
    </div>
  );
}
