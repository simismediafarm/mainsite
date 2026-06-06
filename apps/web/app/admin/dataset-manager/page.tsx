'use client';

import React from 'react';

export default function DatasetManager() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">Dataset Manager</h2>
        <p className="text-sm text-[#bac9cc] mt-1">Manage bulk import/export pipelines for JSON, CSV, RSS, and XML formats.</p>
      </div>

      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 flex flex-col gap-4">
        <div className="flex gap-4 border-b border-[#222222] pb-4">
          <button className="px-4 py-2 bg-[#2a2a2a] text-[#e5e2e1] rounded text-sm font-medium hover:bg-[#333333]">Import Dataset</button>
          <button className="px-4 py-2 bg-[#2a2a2a] text-[#e5e2e1] rounded text-sm font-medium hover:bg-[#333333]">Export Snapshot</button>
        </div>
        <p className="text-[#bac9cc] text-sm">Pipeline schema validator loading...</p>
      </div>
    </div>
  );
}
