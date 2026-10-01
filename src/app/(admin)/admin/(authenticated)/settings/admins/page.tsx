"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import { adminFetch } from "@/utils/adminApi";
import { useToast } from "@/components/admin/ToastContext";
import { Edit2, Trash2, Plus, X, Eye, EyeOff } from "lucide-react";

type Admin = {
  id: number;
  email: string;
  name: string;
  permissions: string[];
  created_at: string;
};

const PERMISSIONS_LIST = [
  { id: "super_admin", label: "Full Access (Super Admin)", desc: "Has access to everything, including settings and admins." },
  { id: "manage_orders", label: "Manage Orders", desc: "Can view, edit, and update order statuses." },
  { id: "manage_products", label: "Manage Products", desc: "Can add, edit, and delete products." },
  { id: "manage_blogs", label: "Manage Blogs", desc: "Can add, edit, and delete blog posts." },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    email: "",
    password: "",
    permissions: ["manage_orders"] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  useEffect(() => {
    try {
      const storeAdmin = localStorage.getItem('store_admin');
      if (storeAdmin) {
        const parsed = JSON.parse(storeAdmin);
        if (parsed?.email) setCurrentUserEmail(parsed.email);
      }
    } catch (e) {}
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/admins");
      if (res && res.admins) {
        setAdmins(res.admins);
      }
    } catch (err: any) {
      if (err.message?.includes('403')) {
        addToast("You do not have permission to view admins.", "error");
      } else {
        addToast("Failed to load admins", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setFormData({ id: 0, name: "", email: "", password: "", permissions: ["manage_orders"] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin: Admin) => {
    setModalMode("edit");
    setFormData({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      password: "", // blank means don't change
      permissions: admin.permissions || []
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setFormData(prev => {
      let newPerms = [...prev.permissions];
      if (newPerms.includes(permId)) {
        newPerms = newPerms.filter(p => p !== permId);
      } else {
        newPerms.push(permId);
      }
      
      return { ...prev, permissions: newPerms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast("Name and email are required.", "error");
      return;
    }
    if (modalMode === "add" && !formData.password) {
      addToast("Password is required for new admins.", "error");
      return;
    }
    if (formData.permissions.length === 0) {
      addToast("Please select at least one permission.", "error");
      return;
    }

    try {
      setSaving(true);
      const endpoint = modalMode === "add" ? "/admins" : `/admins/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const payload: any = {
        name: formData.name,
        email: formData.email,
        permissions: formData.permissions
      };
      if (formData.password) payload.password = formData.password;

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      addToast(`Admin ${modalMode === "add" ? "added" : "updated"} successfully`, "success");
      setIsModalOpen(false);
      loadAdmins();
    } catch (err: any) {
      addToast(err.message || "Failed to save admin", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this admin account?")) return;
    try {
      await adminFetch(`/admins/${id}`, { method: "DELETE" });
      addToast("Admin deleted", "success");
      loadAdmins();
    } catch (err: any) {
      addToast(err.message || "Failed to delete admin", "error");
    }
  };

  if (loading) return <div style={{ padding: 24, color: 'var(--admin-text)' }}>Loading admins...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="admin-page-title">Admin Management</h1>
        <button onClick={handleOpenAdd} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Admin
        </button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role / Permissions</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {admin.name}
                    {admin.email === currentUserEmail && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--admin-primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold' }}>You</span>
                    )}
                  </div>
                </td>
                <td style={{ color: 'var(--admin-text-muted)' }}>{admin.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {admin.permissions?.includes('super_admin') ? (
                      <span className="admin-badge admin-badge-success">Super Admin</span>
                    ) : (
                      admin.permissions?.map(p => {
                        const label = PERMISSIONS_LIST.find(pl => pl.id === p)?.label || p;
                        return <span key={p} className="admin-badge admin-badge-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{label}</span>;
                      })
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenEdit(admin)} className="admin-icon-btn admin-text-primary">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin.id)} className="admin-icon-btn admin-text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-text-muted)' }}>
                  No admins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="admin-modal" style={{ maxWidth: 500, width: '100%', backgroundColor: 'var(--admin-card-bg)', borderRadius: '12px', border: '1px solid var(--admin-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="admin-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{modalMode === "add" ? "Add New Admin" : "Edit Admin"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="admin-icon-btn" style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', padding: 0 }}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ padding: '24px', overflowY: 'auto' }}>
              <form onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label className="admin-label">Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Email</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={modalMode === "edit"}
                    required
                  />
                  {modalMode === 'edit' && <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>Email cannot be changed.</p>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Password {modalMode === 'edit' && '(Leave blank to keep current)'}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="admin-input"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required={modalMode === 'add'}
                      minLength={6}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginTop: 24 }}>
                  <label className="admin-label">Roles & Permissions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {PERMISSIONS_LIST.map(perm => (
                      <label key={perm.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handleTogglePermission(perm.id)}
                          style={{ marginTop: 4 }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '0.9rem' }}>{perm.label}</div>
                          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{perm.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-outline">Cancel</button>
                  <button type="submit" disabled={saving} className="admin-btn-primary">
                    {saving ? "Saving..." : "Save Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
