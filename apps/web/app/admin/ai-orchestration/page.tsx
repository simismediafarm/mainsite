'use client';

import React, { useState } from 'react';

export default function AIOrchestration() {
  const [loading, setLoading] = useState(false);

  const issueKillSwitch = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'admin',
          source: 'ai-orchestrator',
          eventType: 'SYSTEM.MODE_CHANGE',
          payload: { mode: 'dry-run' },
          mode: 'execute'
        })
      });
      alert('Kill switch engaged. System is now in DRy-RUN mode.');
    } catch(err) {
      alert('Failed to engage kill switch.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">AI Orchestration Center</h2>
          <p className="text-sm text-[#bac9cc] mt-1">Cost governor, kill switches, and prompt registry.</p>
        </div>
        <button 
          onClick={issueKillSwitch}
          disabled={loading}
          className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900 rounded text-sm font-bold hover:bg-red-900/50 uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Engaging...' : 'Engage Kill Switch'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
         <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 flex flex-col gap-2">
            <span className="text-xs text-[#bac9cc] uppercase font-mono">Current Inference Mode</span>
            <span className="text-xl text-[#32D74B] font-bold">EXECUTE</span>
         </div>
      </div>
    </div>
  );
}
