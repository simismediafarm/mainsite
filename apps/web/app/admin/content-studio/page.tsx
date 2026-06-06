'use client';

import React, { useEffect, useState } from 'react';
import { SIMISCommand } from '@simis/shared';

export default function ContentStudio() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/mvp/feed')
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    
    const command: Partial<SIMISCommand> = {
      actor: 'admin', // Will be overridden by backend auth
      source: 'web',
      type: `CONTENT.BULK.${action.toUpperCase()}` as any,
      scope: { ids: Array.from(selectedIds) },
      mode: 'execute'
    };

    try {
      const res = await fetch('/api/admin/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });
      const result = await res.json();
      if (result.traceId) {
        alert(`Bulk action ${action} queued successfully. Trace ID: ${result.traceId}`);
      } else {
        alert('Failed to dispatch command.');
      }
    } catch (err) {
      alert('Error dispatching command.');
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  if (loading) return <div className="p-4">Loading Content Studio...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">Content Studio</h2>
          <p className="text-sm text-[#bac9cc] mt-1">Manage posts, pages, and orchestrate mass actions via the Event Bus.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleBulkAction('reprocess')}
            className="px-4 py-2 bg-[#2a2a2a] text-[#00E5FF] border border-[#00E5FF]/30 rounded text-sm font-medium hover:bg-[#333333] disabled:opacity-50"
            disabled={selectedIds.size === 0}
          >
            Bulk AI Reprocess ({selectedIds.size})
          </button>
          <button 
            onClick={() => handleBulkAction('publish')}
            className="px-4 py-2 bg-[#00E5FF] text-black rounded text-sm font-medium hover:bg-[#00daf3] disabled:opacity-50"
            disabled={selectedIds.size === 0}
          >
            Bulk Publish ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#222222] rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-[#e5e2e1]">
          <thead className="bg-[#1a1a1a] border-b border-[#222222] text-[#bac9cc] text-xs uppercase font-mono">
            <tr>
              <th className="p-4 w-12">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(posts.map(p => p.id)));
                    else setSelectedIds(new Set());
                  }}
                  checked={selectedIds.size === posts.length && posts.length > 0}
                />
              </th>
              <th className="p-4">Title</th>
              <th className="p-4">Status</th>
              <th className="p-4">Author</th>
              <th className="p-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="border-b border-[#222222] hover:bg-[#1a1a1a] transition-colors">
                <td className="p-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                  />
                </td>
                <td className="p-4 font-medium">{post.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-mono ${post.status === 'published' ? 'bg-[#32D74B]/20 text-[#32D74B]' : 'bg-[#FFA500]/20 text-[#FFA500]'}`}>
                    {post.status}
                  </span>
                </td>
                <td className="p-4 text-[#bac9cc]">{post.author?.name || post.authorId}</td>
                <td className="p-4 font-mono">{post.trustScore}</td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#bac9cc]">No content available in the registry.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
