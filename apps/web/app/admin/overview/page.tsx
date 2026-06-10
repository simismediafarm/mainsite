"use client";

import React, { useState, useEffect } from 'react';
import { fetchKernelApi } from '../../../lib/kernel-api';

interface SystemMetrics {
  system_health_status: string;
  queue_depth: {
    queued: number;
    completed: number;
    failed: number;
  };
  llm_cost_burn_rate: number;
  fallback_frequency: number;
  recent_event_throughput: number;
  queues: {
    command_queue: string;
    enrichment_queue: string;
  };
  last_updated: string;
}

interface DagNode {
  id: string;
  type: string;
  status: string;
  actor: string | null;
  timestamp: string;
  order: number;
}

interface TraceResponse {
  traceId: string;
  total_events: number;
  dag_reconstruction: DagNode[];
  raw_logs: any[];
}

interface V2Asset {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
}

interface Candidate {
  id: string;
  title: string;
  sourceType: string;
  status: string;
  createdAt: string;
}

export default function AdminControlTowerHome() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);

  // V2 Shadow State
  const [v2Assets, setV2Assets] = useState<V2Asset[]>([]);
  const [loadingV2, setLoadingV2] = useState(true);

  // Pending Candidates State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [actioning, setActioning] = useState<string | null>(null);

  // Execution Mode State
  const [isDryRun, setIsDryRun] = useState(true);
  const [mutatingMode, setMutatingMode] = useState(false);

  // Trace Explorer State
  const [searchTraceId, setSearchTraceId] = useState('');
  const [traceData, setTraceData] = useState<TraceResponse | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [errorTrace, setErrorTrace] = useState<string | null>(null);

  // Action status feedback
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);

  // Fetch metrics & V2 Shadow Data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const data = await fetchKernelApi('/api/admin/metrics');
        setMetrics(data);
        setErrorMetrics(null);
      } catch (err: any) {
        setErrorMetrics(err.message || 'Failed to load system metrics');
      } finally {
        setLoadingMetrics(false);
      }

      // Parallel Fetch V2 Data (Shadow Mode)
      try {
        const v2Data = await fetchKernelApi('/api/v2/registry/assets?limit=5');
        if (v2Data && v2Data.items) {
          setV2Assets(v2Data.items);
        }
      } catch (err) {
        console.warn("V2 Shadow Fetch Failed", err);
      } finally {
        setLoadingV2(false);
      }

      // Pending Content Candidates
      try {
        const [statsData, candidatesData] = await Promise.allSettled([
          fetchKernelApi('/api/admin/posts/stats'),
          fetchKernelApi('/api/admin/posts/candidates?limit=8'),
        ]);
        if (statsData.status === 'fulfilled') setCandidateCount(statsData.value.pendingCandidates ?? 0);
        if (candidatesData.status === 'fulfilled') setCandidates(candidatesData.value.candidates ?? []);
      } catch (err) {
        console.warn('Candidates fetch failed', err);
      }
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsDryRun(process.env.NEXT_PUBLIC_DEFAULT_EXECUTION_MODE !== 'execute');
  }, []);

  const showFeedback = (message: string, isError = false) => {
    setActionFeedback({ message, isError });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleCandidateAction = async (id: string, action: 'approve' | 'reject') => {
    setActioning(id);
    try {
      await fetchKernelApi(`/api/admin/posts/candidates/${id}/${action}`, { method: 'POST' });
      setCandidates(prev => prev.filter(c => c.id !== id));
      setCandidateCount(prev => Math.max(0, prev - 1));
      showFeedback(`Candidate ${action === 'approve' ? 'approved and moved to review' : 'rejected'}`);
    } catch (err: any) {
      showFeedback(`Action failed: ${err.message}`, true);
    } finally {
      setActioning(null);
    }
  };

  const handleModeToggle = async () => {
    const targetMode = isDryRun ? 'execute' : 'dry-run';
    setMutatingMode(true);
    try {
      const result = await fetchKernelApi('/api/admin/command/system/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: targetMode })
      });
      setIsDryRun(result.mode === 'dry-run');
      showFeedback(`Execution mode successfully switched to: ${result.mode.toUpperCase()}`);
    } catch (err: any) {
      showFeedback(`Failed to toggle execution mode: ${err.message}`, true);
    } finally {
      setMutatingMode(false);
    }
  };

  const triggerAction = async (actionType: string, endpoint: string, payload: any = {}) => {
    setActionPending(actionType);
    try {
      const result = await fetchKernelApi(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showFeedback(`Action [${actionType}] executed: ${result.message || 'Success'}`);
    } catch (err: any) {
      showFeedback(`Action [${actionType}] failed: ${err.message}`, true);
    } finally {
      setActionPending(null);
    }
  };

  const handleTraceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTraceId.trim()) return;

    setLoadingTrace(true);
    setErrorTrace(null);
    setTraceData(null);

    try {
      const data = await fetchKernelApi(`/api/admin/trace/${searchTraceId.trim()}`);
      setTraceData(data);
    } catch (err: any) {
      setErrorTrace(err.message || 'Trace ID not found or invalid');
    } finally {
      setLoadingTrace(false);
    }
  };

  return (
    <div className="space-y-8 bg-[#050505] text-[#e5e2e1] min-h-screen font-sans">
      <header className="mb-8 border-b border-[#222] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            SIMIS D-IOS Control Tower v3.2
          </h1>
          <p className="text-[#849396] mt-2 text-sm tracking-wide uppercase">Unified Event-Driven System Operations & Traceability Plane</p>
        </div>
        {metrics && (
          <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-[#111] px-4 py-2 rounded-full border border-[#222]">
            <span className="text-xs text-[#849396] uppercase font-semibold">Health Status</span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${metrics.system_health_status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              {metrics.system_health_status}
            </span>
          </div>
        )}
      </header>

      {actionFeedback && (
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${actionFeedback.isError ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
          <p className="text-sm font-medium">{actionFeedback.message}</p>
        </div>
      )}

      {/* PENDING CONTENT CANDIDATES */}
      {(candidates.length > 0 || candidateCount > 0) && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <span className="bg-orange-500 w-1.5 h-5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
            Pending Content Review
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">
              {candidateCount}
            </span>
          </h2>
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden">
            {candidates.length === 0 ? (
              <p className="p-6 text-sm text-[#849396]">No candidates queued.</p>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#111] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.title}</p>
                      <p className="text-xs text-[#849396] mt-0.5 font-mono">
                        {c.sourceType} · {new Date(c.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button
                        disabled={actioning === c.id}
                        onClick={() => handleCandidateAction(c.id, 'approve')}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {actioning === c.id ? '...' : 'Approve'}
                      </button>
                      <button
                        disabled={actioning === c.id}
                        onClick={() => handleCandidateAction(c.id, 'reject')}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODULE 1: System Overview */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center">
          <span className="bg-blue-500 w-1.5 h-5 mr-3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
          System Overview (Real-time Metrics)
        </h2>
        {errorMetrics && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm mb-4">
            {errorMetrics}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Event Throughput (5m)', value: `${metrics?.recent_event_throughput || 0} events`, sub: 'Live from EventQueueLog', color: 'border-emerald-500' },
            { label: 'Queue Depth', value: `${metrics?.queue_depth?.queued || 0} / ${metrics?.queue_depth?.failed || 0}`, sub: 'Active / Failed', color: 'border-blue-500' },
            { label: 'LLM Burn Rate (1hr)', value: `$${metrics?.llm_cost_burn_rate || 0}`, sub: 'Estimated actual hourly cost', color: 'border-orange-500' },
            { label: 'LLM Fallback Rate', value: `${((metrics?.fallback_frequency || 0) * 100).toFixed(1)}%`, sub: 'Multi-provider routing failure', color: 'border-purple-500' }
          ].map((stat, idx) => (
            <div key={idx} className={`p-6 bg-[#0a0a0a] rounded-2xl border border-[#222] border-t-2 ${stat.color} hover:bg-[#111] transition-all`}>
              <h3 className="text-xs font-semibold text-[#849396] uppercase tracking-wider">{stat.label}</h3>
              <p className="text-3xl font-light text-white mt-3">
                {loadingMetrics ? '...' : stat.value}
              </p>
              <p className="text-xs text-[#555] mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULE 1.5: V2 Intelligence Assets (Shadow Mode) */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center">
          <span className="bg-purple-500 w-1.5 h-5 mr-3 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
          V2 Asset Registry (Shadow Mode)
        </h2>
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6">
          {loadingV2 ? (
            <p className="text-sm text-[#849396]">Syncing V2 Registry...</p>
          ) : v2Assets.length === 0 ? (
            <p className="text-sm text-[#849396]">No assets discovered in V2 endpoints.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#222] text-[#849396]">
                    <th className="pb-3 font-medium">Asset ID</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {v2Assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#111] transition-colors">
                      <td className="py-3 font-mono text-xs text-[#555]">{asset.id.split('-')[0]}</td>
                      <td className="py-3 text-white truncate max-w-[200px]">{asset.title}</td>
                      <td className="py-3 text-[#bac9cc] capitalize">{asset.type}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${
                          asset.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* MODULE 2: Operations Control Center */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center">
          <span className="bg-red-500 w-1.5 h-5 mr-3 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
          Operations Control Center
        </h2>
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-[#222]">
            <div>
              <h3 className="font-semibold text-white">Global Execution Mode</h3>
              <p className="text-sm text-[#849396] mt-1">Toggle between Dry-Run simulation and Live V2 Execution</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0 bg-[#111] p-2 rounded-xl border border-[#222]">
              <span className={`text-xs uppercase font-bold ${isDryRun ? 'text-blue-400' : 'text-[#555]'}`}>Dry-Run</span>
              <button 
                onClick={handleModeToggle}
                disabled={mutatingMode}
                className={`${isDryRun ? 'bg-[#222]' : 'bg-red-500'} w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none disabled:opacity-50 border border-[#333]`}
              >
                <span className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 transform shadow-sm ${isDryRun ? 'translate-x-0' : 'translate-x-7'}`}></span>
              </button>
              <span className={`text-xs uppercase font-bold ${!isDryRun ? 'text-red-400' : 'text-[#555]'}`}>Execute</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => triggerAction('ENTITY.REPROCESS', '/api/admin/command/entity/reprocess')}
              disabled={actionPending !== null}
              className="px-5 py-4 bg-[#111] border border-[#222] rounded-xl text-sm font-medium text-white hover:bg-[#1a1a1a] hover:border-[#333] flex justify-between items-center transition-all"
            >
              <span>{actionPending === 'ENTITY.REPROCESS' ? 'Processing...' : 'Force Reprocess Entity'}</span>
              <span className="text-[10px] bg-[#222] px-2 py-1 rounded text-[#849396] font-mono">ENTITY.REPROCESS</span>
            </button>
            <button 
              onClick={() => triggerAction('CRAWLER.TRIGGER', '/api/admin/command/crawler/trigger')}
              disabled={actionPending !== null}
              className="px-5 py-4 bg-[#111] border border-[#222] rounded-xl text-sm font-medium text-white hover:bg-[#1a1a1a] hover:border-[#333] flex justify-between items-center transition-all"
            >
              <span>{actionPending === 'CRAWLER.TRIGGER' ? 'Triggering...' : 'Trigger Crawler'}</span>
              <span className="text-[10px] bg-[#222] px-2 py-1 rounded text-[#849396] font-mono">CRAWLER.TRIGGER</span>
            </button>
            <button 
              onClick={() => triggerAction('CACHE.INVALIDATE', '/api/admin/command/cache/invalidate', { key: 'all' })}
              disabled={actionPending !== null}
              className="px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 flex justify-between items-center transition-all"
            >
              <span>{actionPending === 'CACHE.INVALIDATE' ? 'Invalidating...' : 'Invalidate Cache'}</span>
              <span className="text-[10px] bg-red-500/20 px-2 py-1 rounded text-red-300 font-mono">CACHE.INVALIDATE</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODULE 3: Trace Explorer DAG */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="bg-emerald-500 w-1.5 h-5 mr-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Trace Explorer DAG
          </h2>
          <form onSubmit={handleTraceSearch} className="mt-4 md:mt-0 flex space-x-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Enter trace ID (e.g., trace_...)"
              value={searchTraceId}
              onChange={(e) => setSearchTraceId(e.target.value)}
              className="px-4 py-2 text-sm border border-[#333] rounded-xl bg-[#111] text-white w-full md:w-72 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={loadingTrace || !searchTraceId.trim()}
              className="px-6 py-2 text-sm bg-emerald-500/20 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/30 border border-emerald-500/50 disabled:opacity-50 transition-colors"
            >
              {loadingTrace ? 'Searching...' : 'Explore'}
            </button>
          </form>
        </div>

        <div className="bg-[#0a0a0a] shadow-2xl rounded-2xl p-8 min-h-64 flex flex-col justify-center border border-[#222]">
          {errorTrace && (
            <div className="text-center text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
              <p>{errorTrace}</p>
            </div>
          )}

          {!traceData && !loadingTrace && !errorTrace && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#222]">
                <svg className="w-8 h-8 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <p className="text-[#849396] text-sm">Enter a Trace ID to visualize the deterministic event path.</p>
            </div>
          )}

          {loadingTrace && (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent"></div>
              <p className="text-[#849396] mt-4 text-sm tracking-wide">Extracting circuit data from EventQueueLog...</p>
            </div>
          )}

          {traceData && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center border-b border-[#222] pb-4">
                <p className="text-sm font-mono text-[#849396]">Trace: <span className="font-bold text-white">{traceData.traceId}</span></p>
                <p className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30">Total {traceData.total_events} Event Nodes</p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 overflow-x-auto py-6 pb-8 hide-scrollbar">
                {traceData.dag_reconstruction.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <div className={`relative p-5 rounded-2xl shadow-lg border w-56 text-center flex flex-col justify-between h-32 transition-transform hover:-translate-y-1 ${
                      node.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/30' :
                      node.status === 'FAILED' ? 'bg-red-500/5 border-red-500/30' : 'bg-yellow-500/5 border-yellow-500/30'
                    }`}>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-2xl blur-md opacity-20 -z-10 ${
                        node.status === 'COMPLETED' ? 'bg-emerald-500' :
                        node.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>

                      <div>
                        <span className="text-[10px] text-[#555] font-black block mb-2 tracking-widest">STEP {node.order + 1}</span>
                        <span className="text-xs font-mono font-medium text-[#e5e2e1] break-words line-clamp-2">{node.type}</span>
                      </div>
                      <div className="mt-3">
                        <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full ${
                          node.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                          node.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                    </div>
                    {index < traceData.dag_reconstruction.length - 1 && (
                      <div className="flex items-center justify-center" aria-hidden="true">
                        <span className="hidden md:inline text-[#333] text-2xl">⟶</span>
                        <span className="inline md:hidden text-[#333] text-2xl">↓</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
