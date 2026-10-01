'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import Link from 'next/link';
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, Globe, AlignLeft, ExternalLink } from 'lucide-react';

export default function BlogsPage() {
  const showToast = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/blogs');
      setBlogs(data.data || data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBlogs(); }, []);

  const deleteBlog = async (id) => {
    if (!confirm('Delete this blog?')) return;
    try {
      await adminFetch(`/blogs/${id}`, { method: 'DELETE' });
      showToast('Deleted successfully');
      await triggerRevalidate('blogs');
      loadBlogs();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const toggleStatus = async (blog) => {
    try {
      const newStatus = blog.status === 'published' ? 'draft' : 'published';
      await adminFetch(`/blogs/${blog.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...blog, status: newStatus }),
      });
      showToast(`Changed to ${newStatus}`);
      await triggerRevalidate('blogs');
      loadBlogs();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const totalBlogs = blogs.length;
  const published = blogs.filter(p => p.status === 'published').length;
  const drafts = blogs.filter(p => p.status === 'draft').length;

  const stats = [
    { label: 'Total Blogs', value: totalBlogs, icon: AlignLeft, color: 'indigo' },
    { label: 'Published', value: published, icon: Globe, color: 'emerald' },
    { label: 'Drafts', value: drafts, icon: EyeOff, color: 'amber' },
  ];

  const formatDate = (d) => {
    try { return new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div>
      {/* Stats */}
      <div className="admin-grid-5" style={{ marginBottom: 20 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="admin-stat-card">
              <div className={`admin-stat-icon ${s.color}`}><Icon size={20} /></div>
              <div>
                <div className="admin-stat-label">{s.label}</div>
                <div className="admin-stat-value" style={{ fontSize: '1.3rem' }}>{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 className="admin-card-title">Blogs</h3>
          </div>
          <Link href="/admin/blog-editor/new" className="admin-btn admin-btn-primary admin-btn-sm">
            <Plus size={15} /> New Blog
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(5).fill(0).map((_, j) => <td key={j}><div className="admin-skeleton admin-skeleton-text" /></td>)}</tr>
                ))
              ) : blogs.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty-state"><BookOpen size={36} /><p>No blogs found</p></td></tr>
              ) : blogs.map(blog => (
                <tr key={blog.id}>
                  <td>
                    <div className="admin-text-primary-dark" style={{ fontWeight: 600 }}>{blog.title}</div>
                    <div className="admin-text-muted" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>/{blog.slug}</div>
                  </td>
                  <td className="admin-text-muted" style={{ fontSize: '0.82rem' }}>{blog.category || 'General'}</td>
                  <td>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleStatus(blog)} style={{ padding: '2px 6px' }}>
                      {blog.status === 'published' ?
                        <Eye size={16} className="admin-text-success" /> :
                        <EyeOff size={16} className="admin-text-muted" />
                      }
                    </button>
                  </td>
                  <td className="admin-text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(blog.updated_at || blog.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link href={`/admin/blog-editor/${blog.id}`} className="admin-btn admin-btn-ghost admin-btn-sm" title="Edit"><Edit2 size={13} /></Link>
                      <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-ghost admin-btn-sm" title="View Live"><ExternalLink size={13} /></a>
                      <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-danger" onClick={() => deleteBlog(blog.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
