'use client';
export const runtime = 'edge';

import React, { useEffect, useState, Fragment } from 'react';
import { adminFetch, uploadToR2, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Plus, Edit2, Trash2, FolderTree, X, Upload, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import GalleryPicker from '@/components/admin/GalleryPicker';

export default function CategoriesPage() {
  const showToast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', parent_id: '', image_url: '', description: '',
    is_active: 1, sort_order: 0, show_on_homepage: 0,
  });
  
  const [galleryOpen, setGalleryOpen] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/categories');
      setCategories(data.categories || data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setForm({
        name: cat.name || '', slug: cat.slug || '', parent_id: cat.parent_id || '',
        image_url: cat.image_url || '', description: cat.description || '',
        is_active: cat.is_active ?? 1, sort_order: cat.sort_order || 0,
        show_on_homepage: cat.show_on_homepage || 0,
      });
    } else {
      setEditingCat(null);
      setForm({ name: '', slug: '', parent_id: '', image_url: '', description: '', is_active: 1, sort_order: 0, show_on_homepage: 0 });
    }
    setModalOpen(true);
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleNameChange = (value) => {
    setForm(prev => ({ ...prev, name: value, slug: editingCat ? prev.slug : generateSlug(value) }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToR2(file, 'categories');
      setForm(prev => ({ ...prev, image_url: url }));
      showToast('Image uploaded');
    } catch (err) {
      showToast('Upload failed', 'error');
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showToast('Name is required', 'error');
    setSaving(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (editingCat) {
        await adminFetch(`/categories/${editingCat.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Category updated');
      } else {
        await adminFetch('/categories', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Category created');
      }
      await triggerRevalidate('categories');
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await adminFetch(`/categories/${id}`, { method: 'DELETE' });
      showToast('Category deleted');
      await triggerRevalidate('categories');
      loadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleCategoryStatus = async (id, field, value) => {
    try {
      // Optimistic update
      setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
      await adminFetch(`/categories/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ field, value })
      });
      showToast('Status updated');
      await triggerRevalidate('categories');
    } catch (err) {
      showToast(err.message, 'error');
      loadCategories(); // Revert on failure
    }
  };

  // Organize into tree
  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <FolderTree size={18} /> Categories
            <span className="admin-bg-gray-light" style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 }}>
              {categories.length}
            </span>
          </h3>
          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => openModal()}>
            <Plus size={15} /> Add Category
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th>Image</th>
                <th>Slug</th>
                <th>Live Products</th>
                <th>Homepage</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(9).fill(0).map((_, j) => <td key={j}><div className="admin-skeleton admin-skeleton-text" /></td>)}</tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={9} className="admin-empty-state"><FolderTree size={36} /><p>No categories yet</p></td></tr>
              ) : (
                parents.map(parent => {
                  const children = getChildren(parent.id);
                  return (
                    <Fragment key={parent.id}>{/* Fragment for parent + children */}
                      <tr key={parent.id} className="admin-bg-surface admin-border-t" style={{ borderTopWidth: 2 }}>
                        <td><div className="admin-cat-parent"><FolderTree size={14} className="admin-text-primary" /> {parent.name}</div></td>
                        <td><span className="admin-inline-badge admin-bg-primary-light" style={{ border: '1px solid var(--admin-primary-light)' }}>Main</span></td>
                        <td>{parent.image_url ? <img src={parent.image_url} alt="" className="admin-image-preview" style={{ width: 36, height: 36 }} /> : '-'}</td>
                        <td className="admin-text-muted" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{parent.slug}</td>
                        <td><span className="admin-inline-badge admin-bg-success-light" style={{ borderRadius: 12 }}>{parent.product_count || 0}</span></td>
                        <td>
                          <label className="admin-toggle">
                            <input type="checkbox" checked={parent.show_on_homepage === 1} onChange={e => toggleCategoryStatus(parent.id, 'show_on_homepage', e.target.checked ? 1 : 0)} />
                            <span className="admin-toggle-track" />
                          </label>
                        </td>
                        <td>
                          <label className="admin-toggle">
                            <input type="checkbox" checked={parent.is_active === 1} onChange={e => toggleCategoryStatus(parent.id, 'is_active', e.target.checked ? 1 : 0)} />
                            <span className="admin-toggle-track" />
                          </label>
                        </td>
                        <td className="admin-text-muted">{parent.sort_order}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openModal(parent)}><Edit2 size={13} /></button>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteCategory(parent.id)}><Trash2 size={13} className="admin-text-danger" /></button>
                          </div>
                        </td>
                      </tr>
                      {children.map(child => (
                        <tr key={child.id}>
                          <td><div className="admin-cat-child">{child.name}</div></td>
                          <td><span className="admin-inline-badge admin-bg-gray-light" style={{ border: '1px solid var(--admin-border-light)' }}>Sub</span></td>
                          <td>{child.image_url ? <img src={child.image_url} alt="" className="admin-image-preview" style={{ width: 32, height: 32 }} /> : '-'}</td>
                          <td className="admin-text-muted" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{child.slug}</td>
                          <td><span className="admin-inline-badge admin-bg-success-light" style={{ borderRadius: 12 }}>{child.product_count || 0}</span></td>
                          <td>
                            <label className="admin-toggle">
                              <input type="checkbox" checked={child.show_on_homepage === 1} onChange={e => toggleCategoryStatus(child.id, 'show_on_homepage', e.target.checked ? 1 : 0)} />
                              <span className="admin-toggle-track" />
                            </label>
                          </td>
                          <td>
                            <label className="admin-toggle">
                              <input type="checkbox" checked={child.is_active === 1} onChange={e => toggleCategoryStatus(child.id, 'is_active', e.target.checked ? 1 : 0)} />
                              <span className="admin-toggle-track" />
                            </label>
                          </td>
                          <td className="admin-text-muted">{child.sort_order}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openModal(child)}><Edit2 size={13} /></button>
                              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteCategory(child.id)}><Trash2 size={13} className="admin-text-danger" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
              <button className="admin-modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-label">Name *</label>
                <input type="text" className="admin-input" value={form.name} onChange={e => handleNameChange(e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug</label>
                <input type="text" className="admin-input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Parent Category</label>
                <select className="admin-select" value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))}>
                  <option value="">None (Main Category)</option>
                  {parents.filter(p => p.id !== editingCat?.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {form.image_url && <img src={form.image_url} alt="" className="admin-image-preview" style={{ width: 60, height: 60 }} />}
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setGalleryOpen(true)} title="Upload or Browse Media">
                    <Upload size={14} /> Browse Media
                  </button>
                  <input type="text" className="admin-input" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Or paste URL" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Description</label>
                <textarea className="admin-textarea" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Sort Order</label>
                  <input type="number" className="admin-input" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} min="0" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                <label className="admin-toggle">
                  <input type="checkbox" checked={form.is_active === 1} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))} />
                  <span className="admin-toggle-track" />
                  <span className="admin-toggle-label">Active</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={form.show_on_homepage === 1} onChange={e => setForm(p => ({ ...p, show_on_homepage: e.target.checked ? 1 : 0 }))} />
                  <span className="admin-toggle-track" />
                  <span className="admin-toggle-label">Show on Homepage</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Gallery Picker */}
      <GalleryPicker 
        defaultFolder="categories/"
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={(url) => setForm(p => ({ ...p, image_url: url }))}
      />
    </div>
  );
}
