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

export default function AdminControlTowerHome() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);

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

  // Fetch metrics on mount & poll every 5s
  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await fetchKernelApi('/api/admin/metrics');
        setMetrics(data);
        setErrorMetrics(null);
      } catch (err: any) {
        setErrorMetrics(err.message || 'Failed to load system metrics');
      } finally {
        setLoadingMetrics(false);
      }
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial execution mode
  useEffect(() => {
    // Mode is resolved dynamically from configurations or env on load
    setIsDryRun(process.env.NEXT_PUBLIC_DEFAULT_EXECUTION_MODE !== 'execute');
  }, []);

  const showFeedback = (message: string, isError = false) => {
    setActionFeedback({ message, isError });
    setTimeout(() => setActionFeedback(null), 5000);
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
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="mb-8 border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">SIMIS D-IOS Control Tower v3.1</h1>
          <p className="text-gray-500 mt-2">Unified Event-Driven System Operations & Traceability Plane</p>
        </div>
        {metrics && (
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <span className="text-xs text-gray-400">Health Status:</span>
            <span className={`px-2 py-1 text-xs font-bold rounded ${metrics.system_health_status === 'OPTIMAL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {metrics.system_health_status}
            </span>
          </div>
        )}
      </header>

      {/* Action Notification Feedback */}
      {actionFeedback && (
        <div className={`p-4 rounded-lg shadow-sm border ${actionFeedback.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <p className="text-sm font-medium">{actionFeedback.message}</p>
        </div>
      )}

      {/* MODULE 1: System Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <span className="bg-blue-500 w-2 h-6 mr-3 rounded"></span>
          System Overview (Real-time Metrics)
        </h2>
        {errorMetrics && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
            {errorMetrics}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600">Event Throughput (5m)</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loadingMetrics ? '...' : metrics?.recent_event_throughput} events
            </p>
            <p className="text-xs text-green-600 mt-1">Live from EventQueueLog</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600">Queue Depth (Active/Failed)</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loadingMetrics ? '...' : `${metrics?.queue_depth.queued} Queued / ${metrics?.queue_depth.failed} Failed`}
            </p>
            <p className="text-xs text-gray-400 mt-1">Supabase DB Engine State</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-orange-500">
            <h3 className="text-sm font-semibold text-gray-600">LLM Burn Rate (1hr)</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loadingMetrics ? '...' : `$${metrics?.llm_cost_burn_rate}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">Estimated actual hourly cost</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-purple-500">
            <h3 className="text-sm font-semibold text-gray-600">LLM Fallback Rate</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loadingMetrics ? '...' : `${((metrics?.fallback_frequency || 0) * 100).toFixed(1)}%`}
            </p>
            <p className="text-xs text-gray-400 mt-1">Multi-provider routing failure rate</p>
          </div>
        </div>
      </section>

      {/* MODULE 2: Operations Control Center */}
      <section>
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <span className="bg-red-500 w-2 h-6 mr-3 rounded"></span>
          Operations Control Center
        </h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div>
              <h3 className="font-semibold text-gray-800">Global Execution Mode</h3>
              <p className="text-sm text-gray-500">Toggle between Dry-Run simulation and Live Execution</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${isDryRun ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>Dry-Run</span>
              <button 
                onClick={handleModeToggle}
                disabled={mutatingMode}
                className={`${isDryRun ? 'bg-gray-200' : 'bg-red-600'} w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none disabled:opacity-50`}
                role="switch"
                aria-checked={!isDryRun}
                aria-label="Toggle execution mode"
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform ${isDryRun ? 'translate-x-0' : 'translate-x-6'}`}></span>
              </button>
              <span className={`text-sm font-medium ${!isDryRun ? 'text-red-600 font-bold' : 'text-gray-400'}`}>Execute</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => triggerAction('ENTITY.REPROCESS', '/api/admin/command/entity/reprocess')}
              disabled={actionPending !== null}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 flex justify-between items-center disabled:opacity-50"
            >
              <span>{actionPending === 'ENTITY.REPROCESS' ? 'Processing...' : 'Force Reprocess Entity'}</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">ENTITY.REPROCESS</span>
            </button>
            <button 
              onClick={() => triggerAction('CRAWLER.TRIGGER', '/api/admin/command/crawler/trigger')}
              disabled={actionPending !== null}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 flex justify-between items-center disabled:opacity-50"
            >
              <span>{actionPending === 'CRAWLER.TRIGGER' ? 'Triggering...' : 'Trigger Crawler'}</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">CRAWLER.TRIGGER</span>
            </button>
            <button 
              onClick={() => triggerAction('CACHE.INVALIDATE', '/api/admin/command/cache/invalidate', { key: 'all' })}
              disabled={actionPending !== null}
              className="px-4 py-3 bg-red-50 border border-red-200 rounded text-sm font-medium text-red-700 hover:bg-red-100 flex justify-between items-center disabled:opacity-50"
            >
              <span>{actionPending === 'CACHE.INVALIDATE' ? 'Invalidating...' : 'Invalidate Cache'}</span>
              <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-600">CACHE.INVALIDATE</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODULE 3: Trace Explorer DAG */}
      <div className="grid grid-cols-1 gap-8">
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700 flex items-center">
              <span className="bg-indigo-500 w-2 h-6 mr-3 rounded"></span>
              Trace Explorer DAG
            </h2>
            <form onSubmit={handleTraceSearch} className="mt-2 md:mt-0 flex space-x-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Enter trace ID (e.g., trace_...)"
                value={searchTraceId}
                onChange={(e) => setSearchTraceId(e.target.value)}
                className="px-3 py-1 text-sm border rounded bg-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="submit"
                disabled={loadingTrace || !searchTraceId.trim()}
                className="px-4 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loadingTrace ? 'Searching...' : 'Explore'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6 min-h-64 flex flex-col justify-center border border-gray-200">
            {errorTrace && (
              <div className="text-center text-red-600 p-4">
                <p>{errorTrace}</p>
              </div>
            )}

            {!traceData && !loadingTrace && !errorTrace && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p className="text-gray-500">Masukkan ID Trace di atas untuk memvisualisasikan jalur eksekusi event.</p>
              </div>
            )}

            {loadingTrace && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 mt-2">Mengekstrak data sirkuit dari EventQueueLog...</p>
              </div>
            )}

            {traceData && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="text-sm font-mono text-gray-600">Trace: <span className="font-bold text-gray-900">{traceData.traceId}</span></p>
                  <p className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Total {traceData.total_events} Node Event</p>
                </div>

                {/* Event DAG visual flowchart */}
                <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 overflow-x-auto py-4">
                  {traceData.dag_reconstruction.map((node, index) => (
                    <React.Fragment key={node.id}>
                      <div className={`p-4 rounded-lg shadow-sm border-2 w-48 text-center flex flex-col justify-between h-28 ${
                        node.status === 'COMPLETED' ? 'bg-green-50 border-green-400' :
                        node.status === 'FAILED' ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'
                      }`}>
                        <div>
                          <span className="text-xs text-gray-400 font-bold block mb-1">STEP {node.order + 1}</span>
                          <span className="text-sm font-mono font-semibold text-gray-800 break-words line-clamp-2">{node.type}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            node.status === 'COMPLETED' ? 'bg-green-200 text-green-900' :
                            node.status === 'FAILED' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'
                          }`}>
                            {node.status}
                          </span>
                        </div>
                      </div>
                      {index < traceData.dag_reconstruction.length - 1 && (
                        <div className="flex items-center justify-center" aria-hidden="true">
                          {/* Horizontal Arrow for desktop, Vertical for mobile */}
                          <span className="hidden md:inline text-gray-400 text-2xl">➔</span>
                          <span className="inline md:hidden text-gray-400 text-2xl">⬇</span>
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
    </div>
  );
}
