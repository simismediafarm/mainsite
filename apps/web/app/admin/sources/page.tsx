'use client';

import React, { useState, useEffect } from 'react';
import { fetchKernelApi } from '../../../lib/kernel-api';

interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  status: string;
  lastFetched: string | null;
  createdAt: string;
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [fetching, setFetching] = useState<string | null>(null);
  const [fetchingAll, setFetchingAll] = useState(false);

  // Add source form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', category: 'general' });
  const [adding, setAdding] = useState(false);

  const loadSources = () => {
    setLoading(true);
    fetchKernelApi('/api/admin/rss/sources')
      .then(data => { setSources(data.sources || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { loadSources(); }, []);

  const handleToggle = async (source: RssSource) => {
    const newStatus = source.status === 'active' ? 'paused' : 'active';
    setToggling(source.id);
    try {
      await fetchKernelApi(`/api/admin/rss/sources/${source.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setSources(prev => prev.map(s => s.id === source.id ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setToggling(null);
    }
  };

  const handleFetchSource = async (id: string) => {
    setFetching(id);
    try {
      const result = await fetchKernelApi(`/api/admin/rss/fetch/${id}`, { method: 'POST' });
      alert(`Ingested ${result.ingestedCount ?? 0} items from ${result.source}`);
      loadSources();
    } catch (err: any) {
      alert(`Fetch failed: ${err.message}`);
    } finally {
      setFetching(null);
    }
  };

  const handleFetchAll = async () => {
    setFetchingAll(true);
    try {
      const result = await fetchKernelApi('/api/admin/rss/fetch', { method: 'POST' });
      alert(`Aggregation complete. Ingested ${result.ingestedCount ?? 0} items.`);
      loadSources();
    } catch (err: any) {
      alert(`Aggregation failed: ${err.message}`);
    } finally {
      setFetchingAll(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setAdding(true);
    try {
      await fetchKernelApi('/api/admin/rss/sources', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', url: '', category: 'general' });
      setShowForm(false);
      loadSources();
    } catch (err: any) {
      alert(`Failed to add source: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e5e2e1]">Source Intelligence</h2>
          <p className="text-sm text-[#bac9cc] mt-1">RSS/API ingest sources. Toggle active status or trigger manual fetch.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFetchAll}
            disabled={fetchingAll}
            className="text-xs px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-[#bac9cc] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {fetchingAll ? 'Fetching...' : '⟳ Fetch All Active'}
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-xs px-3 py-1.5 rounded bg-[#00E5FF] text-[#050505] font-semibold hover:bg-[#00c8e0] transition-colors cursor-pointer"
          >
            + Add Source
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#2a1010] border border-red-800 rounded-lg p-4 text-sm text-red-400">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleAddSource} className="bg-[#0d0d0d] border border-[#333] rounded-lg p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#e5e2e1]">Add RSS Source</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="text-sm px-3 py-2 rounded bg-[#1a1a1a] border border-[#333] text-[#e5e2e1] placeholder-[#555] focus:outline-none focus:border-[#00E5FF]"
              placeholder="Source name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="text-sm px-3 py-2 rounded bg-[#1a1a1a] border border-[#333] text-[#e5e2e1] placeholder-[#555] focus:outline-none focus:border-[#00E5FF] col-span-1"
              placeholder="https://example.com/feed.xml"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              type="url"
              required
            />
            <input
              className="text-sm px-3 py-2 rounded bg-[#1a1a1a] border border-[#333] text-[#e5e2e1] placeholder-[#555] focus:outline-none focus:border-[#00E5FF]"
              placeholder="Category (e.g. tech)"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded border border-[#333] text-[#849396] hover:text-[#e5e2e1] cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={adding} className="text-xs px-3 py-1.5 rounded bg-[#00E5FF] text-[#050505] font-semibold disabled:opacity-50 cursor-pointer">
              {adding ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#0d0d0d] border border-[#222222] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_100px_130px_140px] px-4 py-2 text-xs font-semibold text-[#849396] uppercase border-b border-[#222222]">
          <span>Source</span>
          <span>Category</span>
          <span>Status</span>
          <span>Last Fetched</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#849396]">Loading sources...</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#849396]">No RSS sources configured. Add one above.</div>
        ) : (
          sources.map(source => (
            <div key={source.id} className="grid grid-cols-[1fr_80px_100px_130px_140px] px-4 py-3 border-b border-[#1a1a1a] items-center hover:bg-[#131313] transition-colors">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm text-[#e5e2e1] font-medium truncate">{source.name}</span>
                <span className="text-xs text-[#555] truncate">{source.url}</span>
              </div>

              <span className="text-xs text-[#bac9cc] capitalize">{source.category}</span>

              <button
                onClick={() => handleToggle(source)}
                disabled={toggling === source.id}
                className="flex items-center gap-1.5 text-xs w-fit cursor-pointer disabled:opacity-50"
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${source.status === 'active' ? 'bg-[#32D74B]' : 'bg-[#ff8800]'}`} />
                <span className={source.status === 'active' ? 'text-[#32D74B]' : 'text-[#ff8800]'}>
                  {source.status}
                </span>
              </button>

              <span className="text-xs text-[#849396]">
                {source.lastFetched ? new Date(source.lastFetched).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleFetchSource(source.id)}
                  disabled={fetching === source.id}
                  className="text-xs px-2 py-1 rounded border border-[#333] text-[#bac9cc] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {fetching === source.id ? '...' : 'Fetch'}
                </button>
                <button
                  onClick={() => handleToggle(source)}
                  disabled={toggling === source.id}
                  className="text-xs px-2 py-1 rounded border border-[#333] text-[#bac9cc] hover:border-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {source.status === 'active' ? 'Pause' : 'Enable'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-[#849396] px-1">
        {sources.filter(s => s.status === 'active').length} active · {sources.filter(s => s.status !== 'active').length} paused · {sources.length} total sources
      </p>
    </div>
  );
}
