'use client';

import React, { useState, useEffect } from 'react';
import { fetchKernelApi } from '../../../lib/kernel-api';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignIn: string | null;
  confirmed: boolean;
}

const ROLES = ['member', 'author', 'editor', 'admin', 'system_admin', 'super_admin'];

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#ff3b3b',
  system_admin: '#ff8800',
  admin: '#00E5FF',
  editor: '#a855f7',
  author: '#32D74B',
  member: '#849396',
};

export default function UserAccessPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchKernelApi('/api/admin/users')
      .then(data => { setUsers(data.users || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      await fetchKernelApi(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#e5e2e1] font-sans">User Access Center</h2>
        <p className="text-sm text-[#bac9cc] mt-1">
          Manage RBAC roles. Roles are server-enforced via Supabase <code className="text-xs bg-[#1a1a1a] px-1 rounded">app_metadata.role</code>.
        </p>
      </div>

      {error && (
        <div className="bg-[#2a1010] border border-red-800 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#0d0d0d] border border-[#222222] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_160px_120px_120px] px-4 py-2 text-xs font-semibold text-[#849396] uppercase border-b border-[#222222]">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last Sign In</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#849396]">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#849396]">No users found.</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="grid grid-cols-[1fr_160px_120px_120px] px-4 py-3 border-b border-[#1a1a1a] items-center hover:bg-[#131313] transition-colors">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm text-[#e5e2e1] font-medium truncate">{user.email}</span>
                <span className="text-xs text-[#849396] font-mono">{user.id.slice(0, 8)}…</span>
              </div>

              <div>
                <select
                  value={user.role}
                  disabled={updating === user.id}
                  onChange={e => handleRoleChange(user.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-[#333] bg-[#1a1a1a] cursor-pointer disabled:opacity-50"
                  style={{ color: ROLE_COLORS[user.role] || '#e5e2e1' }}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r} style={{ color: ROLE_COLORS[r] || '#e5e2e1' }}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.confirmed ? 'bg-[#32D74B]' : 'bg-[#ff8800]'}`} />
                <span className="text-xs text-[#bac9cc]">{user.confirmed ? 'Confirmed' : 'Pending'}</span>
              </div>

              <span className="text-xs text-[#849396]">
                {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-[#849396] px-1">
        Total: <strong className="text-[#bac9cc]">{users.length}</strong> users
        {' · '}
        <span>Role changes take effect immediately on next API request.</span>
      </div>
    </div>
  );
}
