import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Network,
  Users,
  Award,
  Rss,
  Search,
  DollarSign,
  Lightbulb,
  Building,
  Database
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { label: "Executive Overview", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Portfolio Intelligence", href: "/admin/network", icon: <Globe className="w-4 h-4" /> },
    { label: "Content Operations", href: "/admin/content", icon: <FileText className="w-4 h-4" /> },
    { label: "Knowledge Graph", href: "/admin/entities", icon: <Network className="w-4 h-4" /> },
    { label: "Author Factory", href: "/admin/authors", icon: <Users className="w-4 h-4" /> },
    { label: "Expert Network", href: "/admin/experts", icon: <Award className="w-4 h-4" /> },
    { label: "Source Intelligence", href: "/admin/sources", icon: <Rss className="w-4 h-4" /> },
    { label: "SEO Command", href: "/admin/seo", icon: <Search className="w-4 h-4" /> },
    { label: "Revenue Ops", href: "/admin/revenue", icon: <DollarSign className="w-4 h-4" /> },
    { label: "Opportunity Discovery", href: "/admin/opportunities", icon: <Lightbulb className="w-4 h-4" /> },
    { label: "M&A Workspace", href: "/admin/acquisition", icon: <Building className="w-4 h-4" /> },
    { label: "BI Warehouse", href: "/admin/warehouse", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col">
        <div className="p-4 bg-slate-950">
          <h1 className="text-xl font-bold text-white tracking-tight">SIMIS OS</h1>
          <p className="text-xs text-slate-500 uppercase mt-1 tracking-wider">Admin Control Tower</p>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors text-sm"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-xs">
              FD
            </div>
            <div>
              <p className="text-sm text-white font-medium">Founder</p>
              <p className="text-xs text-slate-500">Superadmin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-500">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Network Online
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-black">Logout</button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
