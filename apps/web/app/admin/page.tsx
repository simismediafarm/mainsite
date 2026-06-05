import React from 'react';

// SERVER COMPONENT (Read-Only Reactive UI)
export default async function AdminControlTowerHome() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">SIMIS D-IOS Control Tower v3.1</h1>
        <p className="text-gray-500 mt-2">Unified Event-Driven System Operations & Traceability Plane</p>
      </header>

      {/* MODULE 1: System Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <span className="bg-blue-500 w-2 h-6 mr-3 rounded"></span>
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-green-500">
            <h2 className="text-sm font-semibold text-gray-600">Worker Saturation</h2>
            <p className="text-2xl font-bold text-gray-900 mt-2">12%</p>
            <p className="text-xs text-green-600 mt-1">Healthy</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-blue-500">
            <h2 className="text-sm font-semibold text-gray-600">Queue Depth</h2>
            <p className="text-2xl font-bold text-gray-900 mt-2">0 Active / 4 Delayed</p>
            <p className="text-xs text-gray-400 mt-1">BullMQ Backend</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-orange-500">
            <h2 className="text-sm font-semibold text-gray-600">LLM Burn Rate</h2>
            <p className="text-2xl font-bold text-gray-900 mt-2">$0.04 / hr</p>
            <p className="text-xs text-gray-400 mt-1">Token usage</p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg border-t-4 border-purple-500">
            <h2 className="text-sm font-semibold text-gray-600">Cache Hit Ratio</h2>
            <p className="text-2xl font-bold text-gray-900 mt-2">84.2%</p>
            <p className="text-xs text-gray-400 mt-1">ai-cache effectiveness</p>
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
              <span className="text-sm font-medium text-gray-700">Dry-Run</span>
              <button className="bg-gray-200 w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none">
                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-0"></span>
              </button>
              <span className="text-sm font-medium text-red-500">Execute</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 flex justify-between items-center">
              Force Reprocess Entity
              <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">ENTITY.REPROCESS</span>
            </button>
            <button className="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 flex justify-between items-center">
              Trigger Crawler
              <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">CRAWLER.TRIGGER</span>
            </button>
            <button className="px-4 py-3 bg-red-50 border border-red-200 rounded text-sm font-medium text-red-700 hover:bg-red-100 flex justify-between items-center">
              Invalidate Cache
              <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-600">CACHE.INVALIDATE</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODULE 3: Trace Explorer & Queue Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
            <span className="bg-indigo-500 w-2 h-6 mr-3 rounded"></span>
            Trace Explorer DAG
          </h2>
          <div className="bg-white shadow rounded-lg p-6 h-64 flex items-center justify-center border border-dashed border-gray-300">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <p className="text-gray-500">DAG execution graph will be rendered here via api/admin/trace</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
            <span className="bg-yellow-500 w-2 h-6 mr-3 rounded"></span>
            Queue Control Center
          </h2>
          <div className="bg-white shadow rounded-lg p-6 h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
               <h3 className="font-semibold text-gray-700">Recent Queue Events</h3>
               <div className="space-x-2">
                 <button className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded">Pause Workers</button>
                 <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">Replay Failed</button>
               </div>
            </div>
            <ul className="space-y-3">
              <li className="flex justify-between text-sm">
                <span className="text-gray-600 font-mono">cmd_9x8f...</span>
                <span className="text-blue-500">CRAWLER.TRIGGER</span>
                <span className="text-green-500">COMPLETED</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-gray-600 font-mono">cmd_3a1b...</span>
                <span className="text-purple-500">ENTITY.REPROCESS</span>
                <span className="text-yellow-500">DELAYED</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

    </div>
  );
}
