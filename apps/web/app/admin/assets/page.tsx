"use client";

import React, { useState, useEffect } from "react";

interface Asset {
  title: string;
  type: string;
  status: string;
  statusColor: string;
  views: string;
  rpm: string;
  auth: number;
  links: number;
  date: string;
  icon: string;
}

export default function AdminAssetRegistry() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [rpmRange, setRpmRange] = useState(50);
  
  const assets: Asset[] = [
    { title: "Best Enterprise CRM 2024", type: "Comparison", status: "Published", statusColor: "bg-[#32D74B]", views: "12,402", rpm: "$12.45", auth: 82, links: 142, date: "2h ago", icon: "compare_arrows" },
    { title: "Financial Freedom Checklist", type: "Tool", status: "Optimized", statusColor: "bg-[#00daf3]", views: "8,291", rpm: "$9.12", auth: 65, links: 88, date: "4h ago", icon: "construction" },
    { title: "Crypto Tax Laws: A Deep Dive", type: "Article", status: "Review", statusColor: "bg-[#f3bf26]", views: "1,402", rpm: "$18.50", auth: 71, links: 24, date: "1d ago", icon: "article" },
    { title: "SaaS Scaling Bottlenecks", type: "Expert Profile", status: "Draft", statusColor: "bg-[#8E8E93]", views: "0", rpm: "$0.00", auth: 12, links: 4, date: "3d ago", icon: "person" },
    { title: "Direct-to-Consumer Directory", type: "Directory", status: "Published", statusColor: "bg-[#32D74B]", views: "24,901", rpm: "$4.20", auth: 89, links: 562, date: "12m ago", icon: "list_alt" },
    { title: "Mastering Content OS", type: "Article", status: "Published", statusColor: "bg-[#32D74B]", views: "5,521", rpm: "$7.88", auth: 45, links: 31, date: "5h ago", icon: "article" },
    { title: "Global Ad Spend Dataset 2023", type: "Dataset", status: "Optimized", statusColor: "bg-[#00daf3]", views: "2,109", rpm: "$42.00", auth: 94, links: 12, date: "1w ago", icon: "data_table" },
    { title: "Project Management Benchmarks", type: "Tool Page", status: "Review", statusColor: "bg-[#f3bf26]", views: "4,212", rpm: "$11.20", auth: 58, links: 44, date: "2d ago", icon: "analytics" },
    { title: "Venture Capitalist Registry", type: "Entity Pages", status: "Published", statusColor: "bg-[#32D74B]", views: "15,221", rpm: "$15.65", auth: 88, links: 219, date: "3h ago", icon: "apartment" },
    { title: "AI Image Generators Ranked", type: "Comparison", status: "Optimized", statusColor: "bg-[#00daf3]", views: "68,102", rpm: "$5.44", auth: 77, links: 112, date: "1h ago", icon: "compare_arrows" },
    { title: "Cloud Storage Pricing 2024", type: "Comparison", status: "Draft", statusColor: "bg-[#8E8E93]", views: "0", rpm: "$0.00", auth: 34, links: 0, date: "1d ago", icon: "compare_arrows" },
    { title: "Developer Productivity Guide", type: "Article", status: "Published", statusColor: "bg-[#32D74B]", views: "3,114", rpm: "$3.50", auth: 40, links: 18, date: "6h ago", icon: "article" },
    { title: "Remote Work Statistics", type: "Dataset", status: "Review", statusColor: "bg-[#f3bf26]", views: "902", rpm: "$6.20", auth: 55, links: 12, date: "2w ago", icon: "data_table" },
    { title: "Cybersecurity Vendor List", type: "Directory", status: "Published", statusColor: "bg-[#32D74B]", views: "12,450", rpm: "$28.40", auth: 91, links: 412, date: "9h ago", icon: "list_alt" },
    { title: "Marketing Automation Flow", type: "Tool", status: "Optimized", statusColor: "bg-[#00daf3]", views: "1,556", rpm: "$14.12", auth: 62, links: 35, date: "1d ago", icon: "construction" }
  ];

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(assets.map((_, i) => i));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleRow = (index: number) => {
    setSelectedIds(prev => 
      prev.includes(index) ? prev.filter(id => id !== index) : [...prev, index]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="flex-1 flex flex-col bg-[#131313] border border-[#222222] rounded text-[#e5e2e1] font-sans overflow-hidden">
      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-[#121212]/90 backdrop-blur-md px-6 py-2 rounded-full flex items-center gap-4 border border-[#00E5FF]/20 shadow-2xl">
          <span className="text-[#00E5FF] font-mono text-xs">{selectedIds.length} Selected</span>
          <div className="h-4 w-[1px] bg-[#222222]"></div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-[#2a2a2a] text-[#e5e2e1] text-xs rounded hover:bg-[#353534] transition-colors">Clone</button>
            <button className="px-3 py-1 bg-[#2a2a2a] text-[#e5e2e1] text-xs rounded hover:bg-[#353534] transition-colors">Bulk Publish</button>
            <button className="px-3 py-1 bg-[#2a2a2a] text-[#e5e2e1] text-xs rounded hover:bg-[#353534] transition-colors">Link Internally</button>
            <button className="px-3 py-1 bg-[#2a2a2a] text-[#e5e2e1] text-xs rounded hover:bg-[#353534] transition-colors">Schema Sync</button>
            <button className="px-3 py-1 bg-[#93000a] text-[#ffdad6] text-xs rounded hover:opacity-90 transition-colors">Delete</button>
          </div>
          <button className="material-symbols-outlined text-[#bac9cc] hover:text-[#e5e2e1] text-xs" onClick={clearSelection}>close</button>
        </div>
      )}

      {/* Header */}
      <header className="p-6 border-b border-[#222222] bg-[#131313]">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-[#e5e2e1]">Master Asset Registry</h2>
            <p className="text-[#bac9cc] font-mono text-[10px] uppercase mt-1">2,847 Total System Assets Detected</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] text-[#bac9cc] border border-[#222222] rounded text-xs hover:text-[#e5e2e1] transition-colors">
              <span className="material-symbols-outlined text-xs">upload</span> Import
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] text-[#bac9cc] border border-[#222222] rounded text-xs hover:text-[#e5e2e1] transition-colors">
              <span className="material-symbols-outlined text-xs">download</span> Export
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-[#222222]/50 text-xs">
          {["All Assets", "Articles", "Comparisons", "Directories", "Tool Pages", "Entity Pages", "Expert Profiles", "Datasets"].map((tab, i) => (
            <button key={tab} className={`pb-2 whitespace-nowrap font-medium transition-colors ${
              i === 0 ? "text-[#00E5FF] border-b-2 border-[#00E5FF]" : "text-[#bac9cc] hover:text-[#e5e2e1]"
            }`}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Filters */}
      <section className="p-3 border-b border-[#222222] bg-[#0e0e0e] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Cmd+K Search */}
          <div className="relative min-w-[240px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#bac9cc] opacity-50 text-xs">search</span>
            <input className="w-full bg-[#050505] border border-[#222222] rounded py-1.5 pl-9 pr-12 text-xs focus:outline-none focus:border-[#00E5FF] transition-colors placeholder-[#bac9cc]/50" placeholder="Search Assets (Cmd + K)" type="text"/>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1 rounded bg-[#2a2a2a] border border-[#222222] text-[8px] font-mono opacity-40">⌘K</span>
          </div>

          <select className="bg-[#121212] border border-[#222222] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#00E5FF] appearance-none pr-8 relative text-[#bac9cc]">
            <option>All Statuses</option>
            <option>Published</option>
            <option>Draft</option>
            <option>Review</option>
          </select>

          <select className="bg-[#121212] border border-[#222222] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#00E5FF] appearance-none pr-8 relative text-[#bac9cc]">
            <option>Brand Filter</option>
            <option>TechRadar</option>
            <option>FinEdge</option>
          </select>

          <div className="h-6 w-[1px] bg-[#222222] hidden md:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-[#bac9cc] font-mono text-[9px] uppercase tracking-wider">RPM: ${rpmRange}</span>
            <input className="w-20 accent-[#00E5FF]" type="range" min="0" max="100" value={rpmRange} onChange={(e) => setRpmRange(Number(e.target.value))}/>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[#bac9cc] hover:text-[#e5e2e1] text-xs transition-colors">Clear Filters</button>
          <button className="bg-[#00E5FF] text-[#050505] px-4 py-1.5 rounded text-xs font-bold active:scale-95 transition-transform flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs font-bold">bolt</span> Execute Pipeline
          </button>
        </div>
      </section>

      {/* Table */}
      <section className="flex-1 overflow-auto bg-[#050505]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-[#131313] z-10">
            <tr className="border-b border-[#222222]">
              <th className="py-2.5 px-4 w-10 text-center">
                <input 
                  className="rounded bg-transparent border-[#222222] text-[#00E5FF] focus:ring-0" 
                  onChange={toggleAll}
                  checked={selectedIds.length === assets.length}
                  type="checkbox"
                />
              </th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">Asset Title</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">Type</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">Lifecycle</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">7D Views</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">RPM</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">Authority</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">Links</th>
              <th className="py-2.5 px-3 font-mono text-[9px] uppercase tracking-wider text-[#bac9cc]">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]/30 text-xs">
            {assets.map((asset, index) => {
              const isChecked = selectedIds.includes(index);
              return (
                <tr 
                  key={index} 
                  className={`hover:bg-[#121212] transition-colors group cursor-pointer ${isChecked ? "bg-[#1a1a1a]" : ""}`}
                  onClick={() => toggleRow(index)}
                >
                  <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded bg-transparent border-[#222222] text-[#00E5FF] focus:ring-0"
                      checked={isChecked}
                      onChange={() => toggleRow(index)}
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-[#bac9cc] opacity-60">{asset.icon}</span>
                      <span className="font-semibold truncate max-w-[280px]">{asset.title}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#222222] text-[9px] font-mono uppercase text-[#bac9cc]">{asset.type}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${asset.statusColor}`}></div>
                      <span className="text-[10px] text-[#e5e2e1]">{asset.status}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-tight">{asset.views}</span>
                      <div className="flex items-end gap-[1px] h-3 w-12 opacity-60">
                        <div className="bg-[#00daf3] w-1 h-[20%]"></div>
                        <div className="bg-[#00daf3] w-1 h-[40%]"></div>
                        <div className="bg-[#00daf3] w-1 h-[30%]"></div>
                        <div className="bg-[#00daf3] w-1 h-[70%]"></div>
                        <div className="bg-[#00daf3] w-1 h-[50%]"></div>
                        <div className="bg-[#00daf3] w-1 h-[90%]"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[10px] text-[#00daf3]">{asset.rpm}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-0.5 w-16">
                      <div className="flex justify-between font-mono text-[8px] opacity-65">
                        <span>AS</span>
                        <span>{asset.auth}</span>
                      </div>
                      <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00E5FF]" style={{ width: `${asset.auth}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] opacity-60">{asset.links}</td>
                  <td className="py-2.5 px-3 text-[#bac9cc] text-[10px]">{asset.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Footer / Status Bar */}
      <footer className="h-8 px-4 bg-[#050505] border-t border-[#222222] flex items-center justify-between shrink-0 text-[#bac9cc] text-[9px] font-mono uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse"></div>
            <span>System: Live</span>
          </div>
          <div className="h-3 w-[1px] bg-[#222222]"></div>
          <span>Sync: Complete (14s ago)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Matrix v2.2.0-stable</span>
          <div className="flex items-center gap-2">
            <span>Page 1 of 190</span>
            <div className="flex gap-1 text-xs">
              <button className="material-symbols-outlined text-xs hover:text-[#e5e2e1]">chevron_left</button>
              <button className="material-symbols-outlined text-xs hover:text-[#e5e2e1]">chevron_right</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
