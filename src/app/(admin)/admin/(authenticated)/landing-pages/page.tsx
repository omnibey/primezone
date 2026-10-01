"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/utils/adminApi';
import { useToast } from '../layout';
import Link from 'next/link';
import { Search, Monitor, ExternalLink, Plus, Layout, Settings, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPagesIndex() {
  const showToast = useToast();
  const router = useRouter();
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLandingPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(`/landing`);
      setLandingPages(data.landing_pages || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load landing pages', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLandingPages();
  }, [loadLandingPages]);

  const getStatusBadge = (isActive: number) => {
    if (isActive) return <span className="admin-badge admin-badge-active">Published</span>;
    return <span className="admin-badge admin-badge-draft">Draft</span>;
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card-body" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={20} className="admin-text-success" />
              <span className="admin-text-primary-dark" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Standalone Landing Pages</span>
            </div>
            <Link 
              href="/admin/landing-pages/new"
              className="admin-btn admin-btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={16} /> Create Landing Page
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Funnel Details</th>
                <th style={{ width: 120 }}>Price</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 280, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="admin-text-muted" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="admin-spinner" style={{ margin: '0 auto 12px' }}></div>
                    Loading landing pages...
                  </td>
                </tr>
              ) : landingPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-text-muted" style={{ textAlign: 'center', padding: '40px 0' }}>
                    No landing pages found. Click the button above to create one.
                  </td>
                </tr>
              ) : (
                landingPages.map((p: any) => (
                  <tr key={p.id}>
                    <td className="admin-text-muted">#{p.id}</td>
                    <td>
                      <div className="admin-text-primary-dark" style={{ fontWeight: 600, marginBottom: 2 }}>{p.title}</div>
                      <div className="admin-text-muted" style={{ fontSize: '0.8rem' }}>/{p.slug}</div>
                      {p.linked_product_id && (
                        <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} /> Synced to Product #{p.linked_product_id}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>৳{p.base_price}</td>
                    <td>{getStatusBadge(p.is_active)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link href={`/admin/landing-pages/${p.id}`} className="admin-btn admin-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: '0.8rem' }}>
                          <Settings size={14} /> Details
                        </Link>
                        <Link href={`/admin/landing-pages/${p.id}/builder`} className="admin-btn admin-btn-success" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: '0.8rem' }}>
                          <Layout size={14} /> Design
                        </Link>
                        <a href={`/product/landing/${p.slug}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: '0.8rem' }} title="View Landing Page Live">
                          <ExternalLink size={14} /> Live
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
