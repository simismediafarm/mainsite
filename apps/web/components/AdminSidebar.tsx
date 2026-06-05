'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export default function AdminSidebar() {
  const [activePath, setActivePath] = useState('/admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePath(window.location.pathname);
    }
  }, []);

  const navItems: NavItem[] = [
    { label: "Executive Overview", href: "/admin", icon: "dashboard" },
    { label: "Portfolio Intelligence", href: "/admin/network", icon: "hub" },
    { label: "Content Operations", href: "/admin/content", icon: "inventory_2" },
    { label: "Knowledge Graph", href: "/admin/entities", icon: "account_tree" },
    { label: "Author Factory", href: "/admin/authors", icon: "group" },
    { label: "Expert Network", href: "/admin/experts", icon: "verified" },
    { label: "Source Intelligence", href: "/admin/sources", icon: "rss_feed" },
    { label: "SEO Command", href: "/admin/seo", icon: "search" },
    { label: "Revenue Ops", href: "/admin/revenue", icon: "payments" },
    { label: "Opportunity Discovery", href: "/admin/opportunities", icon: "explore" },
    { label: "M&A Workspace", href: "/admin/acquisition", icon: "business" },
    { label: "BI Warehouse", href: "/admin/warehouse", icon: "database" },
  ];

  return (
    <aside className="fixed h-screen w-[280px] left-0 top-0 border-r border-[#222222] bg-[#121212] flex flex-col z-50 text-[#e5e2e1]">
      <div className="px-6 py-6 border-b border-[#222222] flex flex-col gap-1 bg-[#0e0e0e]">
        <h1 className="text-xl font-bold tracking-tight text-[#e5e2e1] font-sans">Sovereign OS</h1>
        <span className="font-mono text-[10px] tracking-wider text-[#bac9cc] uppercase">Operator v2.2.0</span>
      </div>
      
      <div className="px-4 py-4">
        <Link href="/create">
          <button className="w-full flex items-center justify-center gap-2 bg-[#00E5FF] text-[#050505] font-semibold text-xs py-2 px-4 rounded hover:bg-[#00daf3] transition-colors duration-150 active:scale-98">
            <span className="material-symbols-outlined text-[16px] font-bold">add</span>
            <span>New Asset</span>
          </button>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="flex flex-col space-y-0.5">
          {navItems.map((item) => {
            const isActive = activePath === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-2.5 transition-colors duration-150 ${
                    isActive
                      ? "bg-[#2a2a2a] text-[#00E5FF] border-r-2 border-[#00E5FF] font-medium"
                      : "text-[#bac9cc] hover:bg-[#201f1f] hover:text-[#e5e2e1]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="text-xs font-medium font-sans">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#222222] p-4 bg-[#0e0e0e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#2a2a2a] overflow-hidden border border-[#222222] flex items-center justify-center font-bold text-[#00E5FF] text-xs">
            FD
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold font-sans">Founder Agent</span>
            <span className="text-[10px] text-[#bac9cc] opacity-60 uppercase font-mono">Level 4 Clearance</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
