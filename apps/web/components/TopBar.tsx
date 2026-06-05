'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export default function TopBar({ items = [] }: { items?: NavItem[] }) {
  const pathname = usePathname();

  // If path is under /admin, hide standard topbar to let admin layout manage space
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#131313] border-b border-[#222222] backdrop-blur-md">
      <div className="flex justify-between items-center max-w-[1440px] mx-auto px-6 h-14">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-base font-black tracking-tight text-[#00E5FF]">
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span>SIMIS <span className="font-normal text-[#bac9cc]">Platform</span></span>
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-xs text-[#bac9cc] font-medium">
          {items.length > 0 ? items.map((item, idx) => (
            <Link 
              key={idx}
              href={item.href} 
              className={`hover:text-[#00E5FF] transition-colors flex items-center gap-1 ${pathname === item.href ? 'text-[#00E5FF]' : ''}`}
            >
              {item.icon && <span className="material-symbols-outlined text-[14px]">{item.icon}</span>}
              {item.label}
            </Link>
          )) : (
            <div className="font-mono text-[10px] text-[#bac9cc]/50 uppercase tracking-widest border border-dashed border-[#222222] px-2 py-1 rounded-sm">
               MENU AWAITING REGISTRY
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
