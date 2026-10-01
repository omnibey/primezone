'use client';
export const runtime = 'edge';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch, uploadToR2, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Palette, Image as ImageIcon, Upload, Trash2, Plus, Save, X, Monitor, Smartphone, List, Share2, LayoutTemplate, GripVertical } from 'lucide-react';
import GalleryPicker from '@/components/admin/GalleryPicker';

function LayoutEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'branding');
  const [settings, setSettings] = useState<any>({});
  const [rootSettings, setRootSettings] = useState<any>({});

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<{ type: string, key?: string, index?: number, field?: string, folder?: string } | null>(null);

  const handleGallerySelect = (url: string) => {
    if (!galleryTarget) return;
    if (galleryTarget.type === 'setting') updateSetting(galleryTarget.key, url);
    else if (galleryTarget.type === 'banner') updateBanner(galleryTarget.index, galleryTarget.field, url);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch('/settings/all');
        const s = data?.settings || data || {};
        setSettings(s.layout || s || {});
        setRootSettings({
          contact_email: s.contact_email || '',
          contact_phone: s.contact_phone || '',
          whatsapp_number: s.whatsapp_number || '',
          currency_symbol: s.currency_symbol || '৳',
          store_address: s.store_address || ''
        });
      } catch (err) { showToast(err.message, 'error'); }
      finally { setLoading(false); }
    })();
  }, [showToast]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateRootSetting = (key, value) => {
    setRootSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (key, folder = 'banners') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const url = await uploadToR2(file, folder);
        updateSetting(key, url);
        showToast('Image uploaded');
      } catch (err) { showToast('Upload failed', 'error'); }
    };
    input.click();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({ layout: settings, ...rootSettings }),
      });
      showToast('Layout settings saved!');
      await triggerRevalidate('settings');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  // Banner management
  const banners = settings.banners || [];
  const addBanner = () => {
    updateSetting('banners', [...banners, { image: '', link: '', mobile_image: '' }]);
  };
  const updateBanner = (index, field, value) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    updateSetting('banners', updated);
  };
  const removeBanner = (index) => {
    updateSetting('banners', banners.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'menu', label: 'Menu', icon: List },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'homepage', label: 'Homepage', icon: Monitor },
    { id: 'footer', label: 'Footer', icon: LayoutTemplate },
  ];

  // Helper for arrays (menu, explore_links, policy_links)
  const renderListEditor = (key, defaultItem) => {
    const list = settings[key] || [];
    const addItem = () => updateSetting(key, [...list, defaultItem]);
    const updateItem = (index, field, value) => {
      const updated = [...list];
      updated[index] = { ...updated[index], [field]: value };
      updateSetting(key, updated);
    };
    const removeItem = (index) => updateSetting(key, list.filter((_, i) => i !== index));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((item, i) => (
          <div key={i} className="admin-bg-surface admin-border" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 8, border: '1px solid' }}>
            <GripVertical size={16} className="admin-text-muted" style={{ cursor: 'grab' }} />
            <input type="text" className="admin-input" placeholder="Title (use _ for sub-menu)" value={item.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} style={{ flex: 1 }} />
            <input type="text" className="admin-input" placeholder="URL" value={item.url || ''} onChange={e => updateItem(i, 'url', e.target.value)} style={{ flex: 1 }} />
            <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-danger" onClick={() => removeItem(i)}><Trash2 size={16} /></button>
          </div>
        ))}
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={addItem} style={{ alignSelf: 'flex-start', marginTop: 8 }}><Plus size={14} /> Add Item</button>
      </div>
    );
  };

  if (loading) {
    return <div className="admin-card"><div className="admin-card-body">{Array(4).fill(0).map((_, i) => <div key={i} className="admin-skeleton admin-skeleton-text-lg" style={{ width: '60%', marginBottom: 16 }} />)}</div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="admin-tabs" style={{ marginBottom: 0 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div style={{ maxWidth: 800 }}>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">Store Branding</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Store Name</label>
                <input type="text" className="admin-input" value={settings.store_name || ''} onChange={e => updateSetting('store_name', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Tagline</label>
                <input type="text" className="admin-input" value={settings.tagline || ''} onChange={e => updateSetting('tagline', e.target.value)} />
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Logo URL</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" className="admin-input" value={settings.logo_url || ''} onChange={e => updateSetting('logo_url', e.target.value)} style={{ flex: 1 }} />
                      <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setGalleryTarget({ type: 'setting', key: 'logo_url', folder: 'logos/' }); setGalleryOpen(true); }}><Upload size={14} /> Browse Media</button>
                    </div>
                    {settings.logo_url && <img src={settings.logo_url} alt="Logo" style={{ height: 40, marginTop: 8, objectFit: 'contain' }} />}
                    
                    <label className="admin-label">Favicon URL</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" className="admin-input" value={settings.favicon_url || ''} onChange={e => updateSetting('favicon_url', e.target.value)} style={{ flex: 1 }} />
                      <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setGalleryTarget({ type: 'setting', key: 'favicon_url', folder: 'logos/' }); setGalleryOpen(true); }}><Upload size={14} /> Browse Media</button>
                    </div>
                  {settings.favicon_url && <img src={settings.favicon_url} alt="Favicon" style={{ height: 32, marginTop: 8 }} />}
                </div>
              </div>
              <div className="admin-form-grid" style={{ marginTop: 16 }}>
                <div className="admin-form-group">
                  <label className="admin-label">Theme Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={settings.theme_color || '#FF6B35'} onChange={e => updateSetting('theme_color', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{settings.theme_color || '#FF6B35'}</span>
                  </div>
                  <p className="admin-text-muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                    ⚠️ Avoid using white or very light colors — prices, buttons, and links use this color and will become invisible on light backgrounds.
                  </p>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Buy Now Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={settings.buy_now_color || '#06b6d4'} onChange={e => updateSetting('buy_now_color', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{settings.buy_now_color || '#06b6d4'}</span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Secondary / Text Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={settings.secondary_color || '#2e3440'} onChange={e => updateSetting('secondary_color', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{settings.secondary_color || '#2e3440'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">🌙 Dark Mode Colors</h3>
              <span className="admin-text-muted" style={{ fontSize: '0.8rem' }}>Overrides for dark mode only — keeps UI readable regardless of primary color</span>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Price Color <span className="admin-text-muted" style={{ fontWeight: 'normal', fontSize: '0.8em' }}>(Dark Mode)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={settings.dark_price_color || '#e2e8f0'} onChange={e => updateSetting('dark_price_color', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{settings.dark_price_color || '#e2e8f0'}</span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-muted" onClick={() => updateSetting('dark_price_color', '#e2e8f0')} title="Reset to default">↺ Reset</button>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Add to Cart Color <span className="admin-text-muted" style={{ fontWeight: 'normal', fontSize: '0.8em' }}>(Dark Mode)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={settings.dark_btn_add_cart || settings.theme_color || '#ff6b35'} onChange={e => updateSetting('dark_btn_add_cart', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{settings.dark_btn_add_cart || settings.theme_color || '#ff6b35'}</span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-muted" onClick={() => updateSetting('dark_btn_add_cart', settings.theme_color || '#ff6b35')} title="Reset to theme color">↺ Reset</button>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Buy Now Color <span className="admin-text-muted" style={{ fontWeight: 'normal', fontSize: '0.8em' }}>(Dark Mode)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={settings.dark_btn_buy_now || settings.buy_now_color || '#06b6d4'} onChange={e => updateSetting('dark_btn_buy_now', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{settings.dark_btn_buy_now || settings.buy_now_color || '#06b6d4'}</span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-muted" onClick={() => updateSetting('dark_btn_buy_now', settings.buy_now_color || '#06b6d4')} title="Reset to buy now color">↺ Reset</button>
                  </div>
                </div>
              </div>
              <p className="admin-text-muted" style={{ fontSize: '0.8rem', marginTop: 12 }}>
                💡 Tip: If your primary color is black or white, set dark mode button colors to something visible (e.g. orange, cyan).
              </p>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">Store Information & Contact</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Contact Email</label>
                  <input type="email" className="admin-input" value={rootSettings.contact_email || ''} onChange={e => updateRootSetting('contact_email', e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Contact Phone</label>
                  <input type="text" className="admin-input" value={rootSettings.contact_phone || ''} onChange={e => updateRootSetting('contact_phone', e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">WhatsApp Number</label>
                  <input type="text" className="admin-input" value={rootSettings.whatsapp_number || ''} onChange={e => updateRootSetting('whatsapp_number', e.target.value)} placeholder="880XXXXXXXXXX" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Currency Symbol</label>
                  <input type="text" className="admin-input" value={rootSettings.currency_symbol || '৳'} onChange={e => updateRootSetting('currency_symbol', e.target.value)} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Store Address</label>
                <textarea className="admin-textarea" rows={2} value={rootSettings.store_address || ''} onChange={e => updateRootSetting('store_address', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">Social Channels</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Facebook URL</label>
                  <input type="url" className="admin-input" value={settings.footer?.facebook || ''} onChange={e => updateSetting('footer', { ...settings.footer, facebook: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Instagram URL</label>
                  <input type="url" className="admin-input" value={settings.footer?.instagram || ''} onChange={e => updateSetting('footer', { ...settings.footer, instagram: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">YouTube URL</label>
                  <input type="url" className="admin-input" value={settings.footer?.youtube || ''} onChange={e => updateSetting('footer', { ...settings.footer, youtube: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">TikTok URL</label>
                  <input type="url" className="admin-input" value={settings.footer?.tiktok || ''} onChange={e => updateSetting('footer', { ...settings.footer, tiktok: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Announcement Bar</h3></div>
            <div className="admin-card-body">
              <label className="admin-toggle" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={settings.announcement_enabled || false} onChange={e => updateSetting('announcement_enabled', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable</span>
              </label>
              <div className="admin-form-group">
                <label className="admin-label">Announcement Text</label>
                <input type="text" className="admin-input" value={settings.announcement_text || ''} onChange={e => updateSetting('announcement_text', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Link URL</label>
                <input type="text" className="admin-input" value={settings.announcement_link || ''} onChange={e => updateSetting('announcement_link', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === 'menu' && (
        <div style={{ maxWidth: 800 }}>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">Quick Links (Mobile Drawer)</h3></div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings.show_quick_track_order ?? true} onChange={e => updateSetting('show_quick_track_order', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show Track Order</span>
              </label>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings.show_quick_wishlist ?? true} onChange={e => updateSetting('show_quick_wishlist', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show Wishlist</span>
              </label>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings.show_quick_categories ?? true} onChange={e => updateSetting('show_quick_categories', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show Categories</span>
              </label>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Main Navigation Menu</h3></div>
            <div className="admin-card-body">
              <p className="admin-text-muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>Use <code>_</code> before title for sub-menus, and <code>__</code> for nested sub-items.</p>
              {renderListEditor('menu', { title: '', url: '' })}
            </div>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div style={{ maxWidth: 900 }}>
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title"><ImageIcon size={18} /> Banner Settings</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Hero Slider Type</label>
                <select 
                  className="admin-input" 
                  value={settings.bannerType || 'classic'} 
                  onChange={e => updateSetting('bannerType', e.target.value)}
                >
                  <option value="classic">Classic Slider (Standard Carousel)</option>
                  <option value="dynamic">Dynamic Slider (Interactive Peek Effect)</option>
                </select>
                <p className="admin-text-muted" style={{ fontSize: '0.8rem', marginTop: '6px' }}>Choose which slider style to display on the storefront homepage.</p>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title"><ImageIcon size={18} /> Hero Banners</h3>
              <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={addBanner}><Plus size={15} /> Add Banner</button>
            </div>
            <div className="admin-card-body">
              {banners.length === 0 ? (
                <div className="admin-empty-state"><ImageIcon size={36} /><p>No banners added yet</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {banners.map((banner, i) => (
                    <div key={i} className="admin-bg-surface-light admin-border" style={{ padding: 16, borderRadius: 12, border: '1px solid' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span className="admin-text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Banner {i + 1}</span>
                        <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-danger" onClick={() => removeBanner(i)}><Trash2 size={13} /></button>
                      </div>
                      <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="admin-form-group">
                          <label className="admin-label"><Monitor size={12} /> Desktop Image <span className="admin-text-muted" style={{ fontWeight: 'normal', fontSize: '0.8em' }}>(1250x350 px)</span></label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" className="admin-input" value={banner.image || ''} onChange={e => updateBanner(i, 'image', e.target.value)} placeholder="URL" style={{ flex: 1 }} />
                              <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setGalleryTarget({ type: 'banner', index: i, field: 'image' }); setGalleryOpen(true); }}><Upload size={13} /> Browse Media</button>
                            </div>
                          </div>
                          {banner.image && <img src={banner.image} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginTop: 6 }} />}
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label"><Smartphone size={12} /> Mobile Image <span className="admin-text-muted" style={{ fontWeight: 'normal', fontSize: '0.8em' }}>(800x800 px)</span></label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" className="admin-input" value={banner.mobile_image || ''} onChange={e => updateBanner(i, 'mobile_image', e.target.value)} placeholder="URL (optional)" style={{ flex: 1 }} />
                              <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setGalleryTarget({ type: 'banner', index: i, field: 'mobile_image' }); setGalleryOpen(true); }}><Upload size={13} /> Browse Media</button>
                            </div>
                          </div>
                          {banner.mobile_image && <img src={banner.mobile_image} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginTop: 6 }} />}
                        </div>
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-label">Link URL</label>
                        <input type="text" className="admin-input" value={banner.link || ''} onChange={e => updateBanner(i, 'link', e.target.value)} placeholder="e.g. /category/skincare" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Homepage Tab */}
      {activeTab === 'homepage' && (
        <div style={{ maxWidth: 800 }}>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">SEO Defaults</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">SEO Title</label>
                <input type="text" className="admin-input" value={settings.seo_title || ''} onChange={e => updateSetting('seo_title', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">SEO Description</label>
                <textarea className="admin-textarea" rows={3} value={settings.seo_description || ''} onChange={e => updateSetting('seo_description', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">SEO Keywords</label>
                <input type="text" className="admin-input" value={settings.seo_keywords || ''} onChange={e => updateSetting('seo_keywords', e.target.value)} placeholder="Comma separated" />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Homepage Sections</h3></div>
            <div className="admin-card-body">
              <label className="admin-toggle" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={settings.show_featured_categories || false} onChange={e => updateSetting('show_featured_categories', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show Featured Categories</span>
              </label>
              <label className="admin-toggle" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={settings.show_new_arrivals || false} onChange={e => updateSetting('show_new_arrivals', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show New Arrivals</span>
              </label>
              <label className="admin-toggle" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={settings.show_flash_sale || false} onChange={e => updateSetting('show_flash_sale', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show Flash Sale Section</span>
              </label>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings.show_best_sellers || false} onChange={e => updateSetting('show_best_sellers', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Show Best Sellers</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === 'footer' && (
        <div style={{ maxWidth: 800 }}>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">Footer Text</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">About Store Description</label>
                <textarea className="admin-textarea" rows={3} value={settings.footer?.about || ''} onChange={e => updateSetting('footer', { ...settings.footer, about: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Copyright Text</label>
                <input type="text" className="admin-input" value={settings.footer?.copyright || ''} onChange={e => updateSetting('footer', { ...settings.footer, copyright: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header"><h3 className="admin-card-title">Quick Explore Links (Col 2)</h3></div>
            <div className="admin-card-body">
              {renderListEditor('explore_links', { title: '', url: '' })}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Customer Policies Links (Col 3)</h3></div>
            <div className="admin-card-body">
              {renderListEditor('policy_links', { title: '', url: '' })}
            </div>
          </div>
        </div>
      )}
      {/* Gallery Picker */}
      <GalleryPicker 
        defaultFolder={galleryTarget?.folder || 'banners/'}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleGallerySelect}
      />
    </div>
  );
}

export default function LayoutEditorPage() {
  return (
    <Suspense fallback={<div>Loading Layout Editor...</div>}>
      <LayoutEditorContent />
    </Suspense>
  );
}
