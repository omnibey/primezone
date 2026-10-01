'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import Link from 'next/link';
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, Globe, AlignLeft, ExternalLink } from 'lucide-react';

export default function PagesPage() {
  const showToast = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/pages');
      setPages(data.data || data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPages(); }, []);

  const deletePage = async (id) => {
    if (!confirm('Delete this page?')) return;
    try {
      await adminFetch(`/pages/${id}`, { method: 'DELETE' });
      showToast('Deleted successfully');
      await triggerRevalidate('pages');
      loadPages();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const toggleStatus = async (page) => {
    try {
      const newStatus = page.status === 'published' ? 'draft' : 'published';
      await adminFetch(`/pages/${page.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...page, status: newStatus }),
      });
      showToast(`Changed to ${newStatus}`);
      await triggerRevalidate('pages');
      loadPages();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const totalPages = pages.length;
  const published = pages.filter(p => p.status === 'published').length;
  const drafts = pages.filter(p => p.status === 'draft').length;

  const stats = [
    { label: 'Total Pages', value: totalPages, icon: AlignLeft, color: 'indigo' },
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
            <h3 className="admin-card-title">Pages</h3>
          </div>
          <Link href="/admin/page-editor/new" className="admin-btn admin-btn-primary admin-btn-sm">
            <Plus size={15} /> New Page
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(4).fill(0).map((_, j) => <td key={j}><div className="admin-skeleton admin-skeleton-text" /></td>)}</tr>
                ))
              ) : pages.length === 0 ? (
                <tr><td colSpan={4} className="admin-empty-state"><FileText size={36} /><p>No pages found</p></td></tr>
              ) : pages.map(page => (
                <tr key={page.id}>
                  <td>
                    <div className="admin-text-primary-dark" style={{ fontWeight: 600 }}>{page.title}</div>
                    <div className="admin-text-muted" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>/{page.slug}</div>
                  </td>
                  <td>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleStatus(page)} style={{ padding: '2px 6px' }}>
                      {page.status === 'published' ?
                        <Eye size={16} className="admin-text-success" /> :
                        <EyeOff size={16} className="admin-text-muted" />
                      }
                    </button>
                  </td>
                  <td className="admin-text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(page.updated_at || page.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link href={`/admin/page-editor/${page.id}`} className="admin-btn admin-btn-ghost admin-btn-sm" title="Edit"><Edit2 size={13} /></Link>
                      <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-ghost admin-btn-sm" title="View Live"><ExternalLink size={13} /></a>
                      <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-danger" onClick={() => deletePage(page.id)} title="Delete"><Trash2 size={13} /></button>
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
