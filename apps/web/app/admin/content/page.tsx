'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchKernelApi } from '../../../lib/kernel-api';

interface Tag { id: string; name: string; }
interface Author { id: string; name: string; }
interface Post {
  id: string;
  title: string;
  status: string;
  authorId: string;
  author?: Author;
  tags: Tag[];
  createdAt: string;
  trustScore: number;
}

const STATUSES = ['draft', 'pending_review', 'approved', 'published', 'featured', 'archived'];
const STATUS_COLORS: Record<string, string> = {
  published: '#32D74B', featured: '#00E5FF', approved: '#a855f7',
  pending_review: '#ff8800', draft: '#849396', archived: '#555',
};

export default function AdminContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('published');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Edit modal state
  const [editing, setEditing] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    fetchKernelApi(`/api/admin/posts${qs}`)
      .then(data => { setPosts(data.posts || []); setTotal(data.total || 0); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === posts.length ? new Set() : new Set(posts.map(p => p.id)));
  };

  const handleBulkAction = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await fetchKernelApi('/api/admin/posts/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
      });
      setSelected(new Set());
      load();
    } catch (err: any) {
      alert(`Bulk action failed: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const openEdit = (post: Post) => {
    setEditing(post);
    setEditTitle(post.title);
    setEditStatus(post.status);
    setEditTags(post.tags.map(t => t.name).join(', '));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      await fetchKernelApi(`/api/admin/posts/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, status: editStatus, tags }),
      });
      setEditing(null);
      load();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    setDeleting(id);
    try {
      await fetchKernelApi(`/api/admin/posts/${id}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== id));
      setTotal(t => t - 1);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e5e2e1]">Content Management</h2>
          <p className="text-sm text-[#bac9cc] mt-1">Manage all posts: edit, status, tags, bulk actions.</p>
        </div>
        <a href="/create" className="text-xs px-3 py-1.5 rounded bg-[#00E5FF] text-[#050505] font-semibold hover:bg-[#00c8e0] transition-colors">
          + New Post
        </a>
      </div>

      {error && <div className="bg-[#2a1010] border border-red-800 rounded-lg p-4 text-sm text-red-400">{error}</div>}

      {/* Filters + Bulk Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setSelected(new Set()); }}
          className="text-xs px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-[#bac9cc] focus:outline-none focus:border-[#00E5FF] cursor-pointer"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#849396]">{selected.size} selected</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="text-xs px-2 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-[#bac9cc] cursor-pointer"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleBulkAction}
              disabled={bulkLoading}
              className="text-xs px-3 py-1.5 rounded bg-[#a855f7] text-white font-semibold disabled:opacity-50 cursor-pointer hover:bg-[#9333ea] transition-colors"
            >
              {bulkLoading ? 'Updating...' : 'Apply Bulk'}
            </button>
          </div>
        )}

        <span className="text-xs text-[#849396] ml-auto">{total} total posts</span>
      </div>

      {/* Table */}
      <div className="bg-[#0d0d0d] border border-[#222222] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_100px_120px_140px_100px] px-4 py-2 text-xs font-semibold text-[#849396] uppercase border-b border-[#222222]">
          <input type="checkbox" checked={selected.size === posts.length && posts.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
          <span>Title</span>
          <span>Status</span>
          <span>Tags</span>
          <span>Author</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#849396]">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#849396]">No posts found.</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className={`grid grid-cols-[32px_1fr_100px_120px_140px_100px] px-4 py-3 border-b border-[#1a1a1a] items-center hover:bg-[#131313] transition-colors ${selected.has(post.id) ? 'bg-[#0f1f2a]' : ''}`}>
              <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} className="cursor-pointer" />
              <div className="min-w-0">
                <p className="text-sm text-[#e5e2e1] font-medium truncate">{post.title}</p>
                <p className="text-xs text-[#555]">{new Date(post.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
              <span className="text-xs font-medium" style={{ color: STATUS_COLORS[post.status] || '#849396' }}>
                {post.status}
              </span>
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 2).map(t => (
                  <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#849396] border border-[#2a2a2a]">{t.name}</span>
                ))}
                {post.tags.length > 2 && <span className="text-[10px] text-[#555]">+{post.tags.length - 2}</span>}
              </div>
              <span className="text-xs text-[#bac9cc] truncate">{post.author?.name || '—'}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(post)}
                  className="text-xs px-2 py-1 rounded border border-[#333] text-[#bac9cc] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="text-xs px-2 py-1 rounded border border-[#333] text-[#849396] hover:border-red-800 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting === post.id ? '...' : 'Del'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#e5e2e1]">Edit Post</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#849396] uppercase font-semibold">Title</label>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="text-sm px-3 py-2 rounded bg-[#1a1a1a] border border-[#333] text-[#e5e2e1] focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#849396] uppercase font-semibold">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="text-sm px-3 py-2 rounded bg-[#1a1a1a] border border-[#333] text-[#e5e2e1] cursor-pointer focus:outline-none focus:border-[#00E5FF]"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#849396] uppercase font-semibold">Tags (comma-separated)</label>
              <input
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                placeholder="tech, startup, AI"
                className="text-sm px-3 py-2 rounded bg-[#1a1a1a] border border-[#333] text-[#e5e2e1] focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="text-xs px-3 py-1.5 rounded border border-[#333] text-[#849396] hover:text-[#e5e2e1] cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="text-xs px-3 py-1.5 rounded bg-[#00E5FF] text-[#050505] font-semibold disabled:opacity-50 cursor-pointer">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
