'use client';

import React from 'react';

export default function UserAccess() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">User Access Center</h2>
        <p className="text-sm text-[#bac9cc] mt-1">Manage RBAC roles and permissions. Note: Roles are strictly Server-Side enforced.</p>
      </div>

      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
        <p className="text-[#bac9cc] text-sm">Role management matrix loading...</p>
      </div>
    </div>
  );
}
