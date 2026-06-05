import React from "react";
import { registry } from "@/lib/registryClient";

export const dynamic = 'force-dynamic';

export default async function AdminExecutiveDashboard() {
  let logs: any[] = [];
  let metrics: any[] = [];
  let quickActions: any[] = [];
  let brands: any[] = [];

  try {
    const [analyticsRes, widgetRes] = await Promise.allSettled([
      fetch(`http://127.0.0.1:4000/api/v1/analytics/admin`, { cache: 'no-store' }),
      registry.getWidgetByKey('admin_dashboard')
    ]);

    if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
      const data = await analyticsRes.value.json();
      logs = data.logs || [];
      metrics = data.metrics || [];
      brands = data.brands || [];
    }

    if (widgetRes.status === 'fulfilled' && widgetRes.value?.schema) {
      try {
        const parsed = JSON.parse(widgetRes.value.schema);
        quickActions = parsed.quickActions || [];
      } catch (e) {
        console.error("Failed to parse admin widget schema");
      }
    }
  } catch (err) {
    console.error("Failed to fetch admin dashboard data", err);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#e5e2e1] font-sans min-h-screen">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-[#e5e2e1]">Executive Overview</h1>
        <p className="text-xs text-[#bac9cc]">Autonomous Media Holding OS Control Center</p>
      </div>

      {/* KPI Top Row */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-[#121212]/60 backdrop-blur-md p-4 rounded border border-[#222222] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">{metric.label}</span>
                {metric.progress === undefined && (
                  <span className={`font-mono text-[9px] ${
                    metric.type === 'active' ? 'text-[#32D74B]' : 
                    metric.type === 'warning' ? 'text-[#fec931]' : 'text-[#bac9cc]'
                  }`}>
                    {metric.change}
                  </span>
                )}
              </div>
              
              <div className="text-2xl font-bold font-mono tracking-tight text-[#e5e2e1]">{metric.value}</div>
              
              {metric.progress !== undefined && (
                <div className="w-full bg-[#353534] h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#FF2D55] h-full" style={{ width: `${metric.progress}%` }}></div>
                </div>
              )}

              {metric.type === 'active' && (
                <div className="h-6 w-full mt-2 flex items-end gap-[2px] opacity-60">
                  <div className="bg-[#00E5FF] w-full h-[20%] rounded-t-sm"></div>
                  <div className="bg-[#00E5FF] w-full h-[45%] rounded-t-sm"></div>
                  <div className="bg-[#00E5FF] w-full h-[30%] rounded-t-sm"></div>
                  <div className="bg-[#00E5FF] w-full h-[60%] rounded-t-sm"></div>
                  <div className="bg-[#00E5FF] w-full h-[85%] rounded-t-sm"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full border border-dashed border-[#222222] bg-[#121212]/50 rounded p-6 text-center">
           <span className="font-mono text-[10px] text-[#bac9cc] tracking-widest uppercase">AWAITING ANALYTICS AGGREGATION</span>
        </div>
      )}

      {/* Middle Grid: Traffic Chart & Autonomous Actions Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart Panel (60%) */}
        <div className="lg:col-span-7 bg-[#121212]/60 backdrop-blur-md rounded border border-[#222222] flex flex-col min-h-[320px]">
          <div className="p-3 border-b border-[#222222] flex justify-between items-center bg-[#121212]">
            <h2 className="font-mono text-[10px] tracking-wider text-[#e5e2e1] uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#00E5FF]">analytics</span>
              Traffic vs Revenue [90D]
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#bac9cc]">
                <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full"></div> Revenue
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#bac9cc]">
                <div className="w-1.5 h-1.5 bg-[#849396] rounded-full"></div> Traffic
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 relative overflow-hidden bg-[#050505] flex items-end">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#222222 1px, transparent 1px), linear-gradient(90deg, #222222 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
            {/* Dynamic Chart Overlay Here when data is available */}
            {metrics.length === 0 && (
               <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-[#bac9cc]">
                  INSUFFICIENT DATA POINTS
               </div>
            )}
          </div>
        </div>

        {/* Terminal Panel (40%) */}
        <div className="lg:col-span-5 bg-[#0e0e0e] rounded border border-[#222222] flex flex-col min-h-[320px]">
          <div className="p-3 border-b border-[#222222] flex justify-between items-center bg-[#121212]">
            <h2 className="font-mono text-[10px] tracking-wider text-[#e5e2e1] uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#fec931]">terminal</span>
              Autonomous Actions
            </h2>
            <div className="w-2 h-2 rounded-full bg-[#32D74B] animate-pulse"></div>
          </div>
          <div className="flex-1 p-4 font-mono text-[10px] leading-relaxed text-[#bac9cc] overflow-y-auto max-h-[260px]">
            {logs.length > 0 ? logs.map((log, index) => (
              <div key={index} className="flex gap-2 mb-1">
                <span className="text-[#849396]/60">[{log.time}]</span>
                <span className={
                  log.type === 'SUCCESS' ? 'text-[#32D74B]' :
                  log.type === 'WARN' ? 'text-[#FF453A]' :
                  log.type === 'SYS' ? 'text-[#00E5FF]' : 'text-[#fec931]'
                }>{log.type}:</span>
                <span className={log.type === 'METRIC-ALERT' || log.type === 'SUCCESS' ? 'text-[#e5e2e1]' : ''}>{log.text}</span>
              </div>
            )) : (
              <div className="flex gap-2 text-[#849396]/60">
                 Awaiting system telemetry...
              </div>
            )}
            <div className="flex gap-2 mt-4 animate-pulse">
              <span className="text-[#00E5FF]">_</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Portfolio Health Matrix & Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Heatmap Grid (8 Col) */}
        <div className="lg:col-span-8 bg-[#121212]/60 backdrop-blur-md rounded border border-[#222222] flex flex-col">
          <div className="p-3 border-b border-[#222222] bg-[#121212] flex justify-between items-center">
            <h2 className="font-mono text-[10px] tracking-wider text-[#e5e2e1] uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#32D74B]">grid_on</span>
              Portfolio Health Matrix
            </h2>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="font-mono text-[9px] text-[#bac9cc] border-b border-[#222222] uppercase tracking-wider">
                  <th className="py-2 font-normal w-1/3">Property</th>
                  <th className="py-2 font-normal text-center">Uptime</th>
                  <th className="py-2 font-normal text-center">Crawl Rate</th>
                  <th className="py-2 font-normal text-center">Indexing</th>
                  <th className="py-2 font-normal text-center">Revenue Sync</th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#e5e2e1]">
                {brands.length > 0 ? brands.map((brand, idx) => (
                  <tr key={idx} className="border-b border-[#222222]/30 hover:bg-[#201f1f]/50 transition-colors">
                    <td className="py-3 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        brand.status === 'active' ? 'bg-[#32D74B]' :
                        brand.status === 'warning' ? 'bg-[#fec931]' : 'bg-[#FF453A]'
                      }`}></div>
                      {brand.name}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 border rounded text-[9px] font-mono ${
                        brand.status === 'active' ? 'bg-[#32D74B]/10 text-[#32D74B] border-[#32D74B]/20' :
                        brand.status === 'warning' ? 'bg-[#32D74B]/10 text-[#32D74B] border-[#32D74B]/20' :
                        brand.status === 'alert' ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20' : ''
                      }`}>
                        {brand.uptime}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 border rounded text-[9px] font-mono ${
                        brand.crawl === 'OPTIMAL' ? 'bg-[#32D74B]/10 text-[#32D74B] border-[#32D74B]/20' :
                        brand.crawl === 'THROTTLED' ? 'bg-[#fec931]/10 text-[#fec931] border-[#fec931]/20' :
                        brand.crawl === 'BLOCKED' ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20' : ''
                      }`}>
                        {brand.crawl}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-[#32D74B]/10 text-[#32D74B] border border-[#32D74B]/20 rounded text-[9px] font-mono">
                        {brand.indexing}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-[#32D74B]/10 text-[#32D74B] border border-[#32D74B]/20 rounded text-[9px] font-mono">
                        {brand.sync}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                     <td colSpan={5} className="py-6 text-center font-mono text-[10px] text-[#bac9cc]">
                        NO PORTFOLIO PROPERTIES REGISTERED
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Command Actions (4 Col) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          {quickActions.length > 0 ? quickActions.map((action, idx) => (
            <button
              key={idx}
              className={`w-full h-10 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2 border ${
                idx === 0 
                  ? 'bg-[#00E5FF] text-[#050505] border-[#00E5FF] hover:bg-[#00daf3]' 
                  : idx === quickActions.length - 1
                  ? 'bg-transparent border-[#FF2D55] text-[#FF2D55] hover:bg-[#FF2D55]/10 mt-auto'
                  : 'bg-[#121212] border-[#222222] text-[#e5e2e1] hover:border-[#00E5FF] hover:text-[#00E5FF]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{action.icon}</span>
              {action.label}
            </button>
          )) : (
            <div className="w-full h-full min-h-[160px] border border-dashed border-[#222222] rounded flex items-center justify-center font-mono text-[10px] text-[#bac9cc]">
               COMMAND WIDGET UNCONFIGURED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
