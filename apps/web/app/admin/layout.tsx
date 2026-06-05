import React from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e2e1] flex">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px] flex flex-col min-w-0 bg-[#050505] min-h-screen">
        <header className="h-14 bg-[#131313] border-b border-[#222222] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="font-sans text-sm font-semibold text-[#e5e2e1]">Network Control</div>
            <div className="h-4 w-px bg-[#222222]"></div>
            <div className="flex items-center gap-1.5 text-xs text-[#bac9cc]">
              <span>Founder</span>
              <span className="material-symbols-outlined text-[12px] text-[#849396]">chevron_right</span>
              <span className="text-[#e5e2e1]">Control Tower</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#bac9cc]">
              <span className="inline-block w-1.5 h-1.5 bg-[#32D74B] rounded-full animate-pulse mr-1"></span>
              All Nodes Online
            </div>
            <div className="h-4 w-px bg-[#222222]"></div>
            <button className="text-xs text-[#bac9cc] hover:text-[#00E5FF] transition-colors">Logout</button>
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
