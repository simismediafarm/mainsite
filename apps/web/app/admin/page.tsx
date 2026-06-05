"use client";

import React from "react";
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Users, 
  FileText, 
  Search, 
  DollarSign,
  Zap
} from "lucide-react";

export default function AdminExecutiveDashboard() {
  const metrics = [
    { label: "Total Sites", value: "1", icon: <Globe className="w-5 h-5" />, trend: "+0%" },
    { label: "Total Entities", value: "0", icon: <Users className="w-5 h-5" />, trend: "+0%" },
    { label: "Total Topics", value: "0", icon: <FileText className="w-5 h-5" />, trend: "+0%" },
    { label: "Total Posts", value: "3", icon: <FileText className="w-5 h-5" />, trend: "+3" },
    { label: "Indexed Pages", value: "0", icon: <Search className="w-5 h-5" />, trend: "0%" },
    { label: "Organic Clicks", value: "0", icon: <Activity className="w-5 h-5" />, trend: "0%" },
    { label: "Revenue (Today)", value: "$0.00", icon: <DollarSign className="w-5 h-5" />, trend: "0%" },
    { label: "Avg RPM", value: "$0.00", icon: <BarChart3 className="w-5 h-5" />, trend: "0%" },
  ];

  const quickActions = [
    "Generate Author Network",
    "Generate Expert Network",
    "Discover Keyword Gaps",
    "Import RSS Sources",
    "Bulk Publish",
    "Bulk Refresh",
    "Bulk Schema Rebuild",
    "Run Internal Linking",
    "Entity Reconciliation",
    "Revenue Optimization"
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Overview</h1>
        <p className="text-slate-500">Autonomous Media Holding OS Control Center</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              {metric.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Network Traffic & Revenue
          </h2>
          <div className="flex-1 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
            [Chart Component Placeholder]
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Autonomous Actions
          </h2>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {quickActions.map((action, idx) => (
              <button 
                key={idx}
                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Network Health & AI Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Authority Score</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">12</span>
              <span className="text-sm text-slate-400 mb-1">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full w-[12%]"></div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Portfolio Health Score</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">85</span>
              <span className="text-sm text-slate-400 mb-1">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-green-500 h-full w-[85%]"></div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Content Velocity</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">0</span>
              <span className="text-sm text-slate-400 mb-1">posts/day</span>
            </div>
         </div>
      </div>
    </div>
  );
}
