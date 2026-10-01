'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Plus, Edit2, Trash2, Ticket, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CouponsPage() {
  const showToast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', type: 'Fixed', value: '', min_order: 0, max_uses: 0, active: 1, expires_at: '',
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/coupons');
      setCoupons(data.coupons || data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCoupons(); }, []);

  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code || '', type: coupon.type || 'Fixed', value: coupon.value || '',
        min_order: coupon.min_order || 0, max_uses: coupon.max_uses || 0,
        active: coupon.active ?? 1, expires_at: coupon.expires_at || '',
      });
    } else {
      setEditingCoupon(null);
      setForm({ code: '', type: 'Fixed', value: '', min_order: 0, max_uses: 0, active: 1, expires_at: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return showToast('Code is required', 'error');
    if (!form.value) return showToast('Value is required', 'error');
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        min_order: Number(form.min_order) || 0,
        max_uses: Number(form.max_uses) || 0,
        expires_at: form.expires_at || null,
      };

      if (editingCoupon) {
        await adminFetch(`/coupons/${editingCoupon.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Coupon updated');
      } else {
        await adminFetch('/coupons', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Coupon created');
      }
      setModalOpen(false);
      loadCoupons();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminFetch(`/coupons/${id}`, { method: 'DELETE' });
      showToast('Coupon deleted');
      loadCoupons();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const toggleActive = async (coupon) => {
    try {
      await adminFetch(`/coupons/${coupon.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...coupon, active: coupon.active ? 0 : 1 }),
      });
      showToast(coupon.active ? 'Coupon deactivated' : 'Coupon activated');
      loadCoupons();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><Ticket size={18} /> Coupons</h3>
          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => openModal()}>
            <Plus size={15} /> Add Coupon
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Uses</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><div className="admin-skeleton admin-skeleton-text" /></td>)}</tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="admin-empty-state"><Ticket size={36} /><p>No coupons yet</p></td></tr>
              ) : coupons.map(coupon => (
                <tr key={coupon.id}>
                  <td className="admin-text-primary-dark" style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{coupon.code}</td>
                  <td><span className={`admin-badge ${coupon.type === 'Percentage' ? 'admin-badge-processing' : 'admin-badge-shipped'}`}>{coupon.type}</span></td>
                  <td style={{ fontWeight: 600 }}>{coupon.type === 'Percentage' ? `${coupon.value}%` : `৳${coupon.value}`}</td>
                  <td className="admin-text-muted">৳{coupon.min_order || 0}</td>
                  <td className="admin-text-muted">{coupon.used_count}/{coupon.max_uses || '∞'}</td>
                  <td>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleActive(coupon)} style={{ padding: '2px 6px' }}>
                      {coupon.active ? <ToggleRight size={20} className="admin-text-success" /> : <ToggleLeft size={20} className="admin-text-muted" />}
                    </button>
                  </td>
                  <td className="admin-text-muted" style={{ fontSize: '0.78rem' }}>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openModal(coupon)}><Edit2 size={13} /></button>
                      <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteCoupon(coupon.id)}><Trash2 size={13} className="admin-text-danger" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h3>
              <button className="admin-modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-label">Coupon Code *</label>
                <input type="text" className="admin-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.08em' }} />
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Type</label>
                  <select className="admin-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="Fixed">Fixed Amount (৳)</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Value *</label>
                  <input type="number" className="admin-input" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} min="0" step="0.01" placeholder={form.type === 'Percentage' ? 'e.g. 20' : 'e.g. 100'} />
                </div>
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Min Order Amount</label>
                  <input type="number" className="admin-input" value={form.min_order} onChange={e => setForm(p => ({ ...p, min_order: Number(e.target.value) }))} min="0" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Max Uses (0 = unlimited)</label>
                  <input type="number" className="admin-input" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: Number(e.target.value) }))} min="0" />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Expiry Date</label>
                <input type="date" className="admin-input" value={form.expires_at ? form.expires_at.split('T')[0] : ''} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
                <div className="admin-form-hint">Leave empty for no expiry</div>
              </div>
              <label className="admin-toggle" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={form.active === 1} onChange={e => setForm(p => ({ ...p, active: e.target.checked ? 1 : 0 }))} />
                <span className="admin-toggle-track" />
                <span className="admin-toggle-label">Active</span>
              </label>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
