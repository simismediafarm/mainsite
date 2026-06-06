'use client';

import React, { useEffect, useState } from 'react';

export default function TraceExplorer() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/command?query=events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading Trace Explorer...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">Trace Explorer</h2>
        <p className="text-sm text-[#bac9cc] mt-1">Visualize the Event DAG and State Reconstructions.</p>
      </div>

      <div className="bg-[#121212] border border-[#222222] rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-[#e5e2e1]">
          <thead className="bg-[#1a1a1a] border-b border-[#222222] text-[#bac9cc] text-xs uppercase font-mono">
            <tr>
              <th className="p-4">Trace ID</th>
              <th className="p-4">Event Type</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id} className="border-b border-[#222222] hover:bg-[#1a1a1a] transition-colors">
                <td className="p-4 font-mono text-[11px] text-[#00E5FF]">{event.traceId}</td>
                <td className="p-4 font-mono">{event.eventType}</td>
                <td className="p-4 text-[#bac9cc]">{event.actor}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-mono ${event.status === 'COMPLETED' ? 'bg-[#32D74B]/20 text-[#32D74B]' : 'bg-[#FFA500]/20 text-[#FFA500]'}`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#bac9cc]">No events recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
