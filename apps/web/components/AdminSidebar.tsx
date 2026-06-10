'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navGroups = [
  {
    label: 'Intelligence',
    items: [
      { label: 'Overview', href: '/admin/overview', icon: 'dashboard' },
      { label: 'Trace Explorer', href: '/admin/trace-explorer', icon: 'account_tree' },
      { label: 'AI Orchestration', href: '/admin/ai-orchestration', icon: 'psychology' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'All Posts', href: '/admin/posts', icon: 'article' },
      { label: 'Content Studio', href: '/admin/content-studio', icon: 'inventory_2' },
      { label: 'CMS Review', href: '/admin/cms', icon: 'edit_note' },
      { label: 'Create Post', href: '/create', icon: 'add_circle' },
      { label: 'Authors', href: '/admin/authors', icon: 'person' },
      { label: 'Entities', href: '/admin/entities', icon: 'category' },
      { label: 'Sources', href: '/admin/sources', icon: 'rss_feed' },
      { label: 'Ingestion', href: '/admin/ingestion', icon: 'download' },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { label: 'Revenue', href: '/admin/revenue', icon: 'payments' },
      { label: 'Monetization', href: '/admin/monetization', icon: 'monetization_on' },
      { label: 'Ads', href: '/admin/ads', icon: 'campaign' },
      { label: 'Opportunities', href: '/admin/opportunities', icon: 'trending_up' },
      { label: 'Acquisition', href: '/admin/acquisition', icon: 'ads_click' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Dataset Manager', href: '/admin/dataset-manager', icon: 'dataset' },
      { label: 'SEO', href: '/admin/seo', icon: 'search' },
      { label: 'Ranking', href: '/admin/ranking', icon: 'leaderboard' },
      { label: 'Network', href: '/admin/network', icon: 'hub' },
      { label: 'Warehouse', href: '/admin/warehouse', icon: 'warehouse' },
      { label: 'Integrations', href: '/admin/integrations', icon: 'extension' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'M&E', href: '/admin/monev', icon: 'analytics' },
      { label: 'Assets', href: '/admin/assets', icon: 'folder' },
      { label: 'User Access', href: '/admin/user-access', icon: 'shield_person' },
      { label: 'System', href: '/admin/system', icon: 'settings' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    // Clear basic auth by navigating to a URL with bad credentials
    // Forces browser to clear the saved Basic Auth credentials
    fetch('/admin/overview', {
      headers: { Authorization: 'Basic ' + btoa('logout:logout') },
    }).catch(() => {}).finally(() => {
      window.location.href = '/';
    });
  };

  return (
    <aside className="fixed h-screen w-[240px] left-0 top-0 border-r border-[#222222] bg-[#0e0e0e] flex flex-col z-50 text-[#e5e2e1]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#222222] flex flex-col gap-0.5">
        <h1 className="text-base font-bold tracking-tight text-[#e5e2e1]">MediaFarm OS</h1>
        <span className="font-mono text-[9px] tracking-wider text-[#bac9cc] uppercase">Operator v4.1.0</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1 font-mono text-[9px] tracking-widest text-[#bac9cc]/50 uppercase">
              {group.label}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors ${
                        isActive
                          ? 'bg-[#1e2a2a] text-[#00E5FF] font-semibold'
                          : 'text-[#bac9cc] hover:bg-[#1a1a1a] hover:text-[#e5e2e1]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#222222] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#1e2a2a] border border-[#222222] flex items-center justify-center font-bold text-[#00E5FF] text-[10px]">
            FD
          </div>
          <div>
            <div className="text-[11px] font-bold">Founder</div>
            <div className="text-[9px] text-[#bac9cc] font-mono uppercase">Level 4</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-[#bac9cc] hover:text-[#00E5FF] transition-colors"
          title="Logout"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
        </button>
      </div>
    </aside>
  );
}
