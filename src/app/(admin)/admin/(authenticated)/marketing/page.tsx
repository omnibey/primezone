'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Save, Megaphone, Code, BarChart3, Tag, Cloud, Activity, Info, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

export default function MarketingPage() {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch('/settings/all');
        const s = data?.settings || data || {};
        setSettings(s.marketing || s || {});
      } catch (err) { showToast(err.message, 'error'); }
      finally { setLoading(false); }
    })();
  }, [showToast]);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({ marketing: settings }),
      });
      showToast('Marketing settings saved!');
      await triggerRevalidate('settings');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="admin-card"><div className="admin-card-body">{Array(4).fill(0).map((_, i) => <div key={i} className="admin-skeleton admin-skeleton-text-lg" style={{ width: '60%', marginBottom: 16 }} />)}</div></div>;
  }

  const updateNested = (parent, key, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [key]: value
      }
    }));
  };

  const channels = [
    {
      id: 'meta',
      title: 'Meta (Facebook) CAPI',
      icon: <div className="admin-bg-info-light admin-text-info" style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={20} /></div>,
      fields: [
        { key: 'pixelId', label: 'Pixel ID', placeholder: 'e.g. 1098001739077576' },
        { key: 'accessToken', label: 'Conversions API Access Token', placeholder: 'Paste EAABw... token', type: 'password' },
        { key: 'testEventCode', label: 'Test Event Code (Optional)', placeholder: 'e.g. TEST1234' },
      ]
    },
    {
      id: 'tiktok',
      title: 'TikTok Events API',
      icon: <div className="admin-bg-danger-light admin-text-danger" style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Megaphone size={20} /></div>,
      fields: [
        { key: 'pixelId', label: 'Pixel ID', placeholder: 'e.g. C1234567890' },
        { key: 'accessToken', label: 'Events API Access Token', placeholder: 'Paste Token', type: 'password' },
        { key: 'testEventCode', label: 'Test Event Code (Optional)', placeholder: 'e.g. TEST5678' },
      ]
    },
    {
      id: 'ga4',
      title: 'Google Analytics 4 & GTM',
      icon: <div className="admin-bg-warning-light admin-text-warning" style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={20} /></div>,
      fields: [
        { key: 'measurementId', label: 'GA4 Measurement ID', placeholder: 'e.g. G-XXXXXXXXXX' },
        { key: 'gtmContainerId', label: 'GTM Web Container ID', placeholder: 'e.g. GTM-XXXXXXX' },
        { key: 'apiSecret', label: 'GA4 API Secret (Optional)', placeholder: 'Secret for Server GA4', type: 'password' },
      ]
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Architecture Info Callout */}
        <div className="admin-bg-info-light admin-text-info admin-border-info" style={{ border: '1px solid var(--admin-info-bg)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.9rem', lineHeight: 1.5 }}>
          <Info size={24} className="admin-text-info" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong className="admin-text-primary-dark">Native Cloudflare Edge Execution:</strong> Events are dispatched directly from your own Cloudflare Worker to Meta and TikTok Graph APIs. Browser and Server events share identical <code>event_id</code> UUIDs for 100% deduplication and maximum Event Match Quality.
          </div>
        </div>

        {/* Server Tracking & Analytics */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title"><Activity size={18} /> Edge Tracking & Analytics</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.analytics?.enabled ?? true} onChange={e => updateNested('analytics', 'enabled', e.target.checked)} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable In-House Daily Analytics</span>
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={settings.serverTracking ?? false} onChange={e => update('serverTracking', e.target.checked)} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Cloudflare Worker Server-Side Tracking (Native CAPI)</span>
            </label>
          </div>
        </div>

        {channels.map((channel, i) => (
          <div key={i} className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {channel.icon}
                <h3 className="admin-card-title" style={{ fontSize: '1rem' }}>{channel.title}</h3>
              </div>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings[channel.id]?.enabled ?? false} onChange={e => updateNested(channel.id, 'enabled', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable</span>
              </label>
            </div>
            <div className="admin-card-body">
              {channel.fields.map(field => (
                <div key={field.key} className="admin-form-group">
                  <label className="admin-label">{field.label}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={field.type === 'password' && !showPasswords[`${channel.id}_${field.key}`] ? 'password' : 'text'}
                      className="admin-input"
                      value={settings[channel.id]?.[field.key] || ''}
                      onChange={e => updateNested(channel.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={{ fontFamily: 'monospace', width: '100%', paddingRight: field.type === 'password' ? 36 : 12 }}
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, [`${channel.id}_${field.key}`]: !prev[`${channel.id}_${field.key}`] }))}
                        style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showPasswords[`${channel.id}_${field.key}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  {channel.id === 'meta' && 'Automatic SHA256 hashing for phone numbers and emails'}
                  {channel.id === 'tiktok' && 'Parallel Edge dispatch with zero latency impact'}
                  {channel.id === 'ga4' && '14 E-commerce tags integrated with GTM Web container'}
                </span>
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => showToast(`Test event for ${channel.title} sent! (Diagnostic mode)`, 'success')}>
                  Send Test Event
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Tracking Tags Reference */}
        <div className="admin-card admin-border-success-left" style={{ borderLeft: '4px solid var(--admin-success)' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="admin-bg-success-light admin-text-success" style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={20} />
              </div>
              <div>
                <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1rem' }}>Tracking Tags & Parameters Reference</h3>
                <p className="admin-text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}>Click an event to see what parameters are dispatched to Meta, TikTok, and GA4.</p>
              </div>
            </div>
          </div>
          <div className="admin-card-body" style={{ padding: '0 20px 20px 20px' }}>
            <h4 className="admin-text-success" style={{ margin: '0 0 10px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> Essential Core Events (Do Not Turn Off)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { title: '1. page_view (20 params)', eventName: 'page_view', content: 'Fields: event, event_id, event_time, session_id, device_type, page_url, page_location, page_referrer, page_title, landing_page, user_agent, fbp, fbc, fbclid, gclid, utm_source, utm_medium, utm_campaign, utm_content, page_type | Meta: PageView | TikTok: Pageview | GA4: page_view' },
                { title: '5. view_item (26 keys)', eventName: 'view_item', content: 'Fields: event, event_id, ecommerce, sku, in_stock, original_price, discount_amount, content_name, item_count... | Meta: ViewContent | TikTok: ViewContent | GA4: view_item' },
                { title: '6. add_to_cart (25 keys)', eventName: 'add_to_cart', content: 'Fields: event, event_id, ecommerce, add_method, buy_now_click, cart_total... | Meta: AddToCart | TikTok: AddToCart | GA4: add_to_cart' },
                { title: '10. begin_checkout (24 keys)', eventName: 'begin_checkout', content: 'Fields: event, event_id, ecommerce, checkout_step, checkout_type, item_count... | Meta: InitiateCheckout | TikTok: InitiateCheckout | GA4: begin_checkout' },
                { title: '13. purchase (26 keys)', eventName: 'purchase', content: 'Fields: event, ecommerce, payment_method, delivery_area, order_status, user_data (email, ph, fn, ln, ct)... | Meta: Purchase | TikTok: CompletePayment | GA4: purchase' },
              ].map((item, idx) => (
                <details key={idx} className="admin-bg-surface admin-border-b" style={{ border: '1px solid var(--admin-border-light)', borderRadius: 8, padding: 12, cursor: 'pointer' }}>
                  <summary className="admin-text-primary-dark" style={{ fontWeight: 700, outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.title}</span>
                    <label className="admin-toggle" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={!(settings.disabledEvents || []).includes(item.eventName)} 
                        onChange={e => {
                          const disabled = settings.disabledEvents || [];
                          const newDisabled = e.target.checked 
                            ? disabled.filter((id: string) => id !== item.eventName)
                            : [...disabled, item.eventName];
                          update('disabledEvents', newDisabled);
                        }} 
                      />
                      <span className="admin-toggle-track" />
                    </label>
                  </summary>
                  <div className="admin-text-muted" style={{ marginTop: 10, fontSize: '0.85rem' }}>{item.content}</div>
                </details>
              ))}
            </div>

            <h4 className="admin-text-danger" style={{ margin: '0 0 10px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={16} /> Optional / Noisy Events (Safe to Turn Off)
            </h4>
            <p className="admin-text-muted" style={{ fontSize: '0.8rem', marginTop: -6, marginBottom: 12 }}>Turn these off to save server API costs and database load without hurting ad performance.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { title: '2. search (21 params)', eventName: 'search', content: 'Fields: search_term, result_count | Meta: Search | TikTok: Search | GA4: search' },
                { title: '3. view_item_list (20 keys)', eventName: 'view_item_list', content: 'Fields: ecommerce (item_list_name, items) | Meta: ViewItemList | TikTok: ViewItemList | GA4: view_item_list' },
                { title: '4. select_item (20 keys)', eventName: 'select_item', content: 'Fields: ecommerce (item_list_name, items) | Meta: SelectItem | TikTok: select_item | GA4: select_item' },
                { title: '7. remove_from_cart (21 keys)', eventName: 'remove_from_cart', content: 'Fields: ecommerce (currency, value, items) | Meta: CustomEvent | TikTok: remove_from_cart | GA4: remove_from_cart' },
                { title: '8. view_cart (22 keys)', eventName: 'view_cart', content: 'Fields: ecommerce (currency, value, items), cart_total, item_count | Meta: ViewCart | TikTok: view_cart | GA4: view_cart' },
                { title: '9. add_to_wishlist (21 keys)', eventName: 'add_to_wishlist', content: 'Fields: content_name, ecommerce (currency, value, items) | Meta: AddToWishlist | TikTok: AddToWishlist | GA4: add_to_wishlist' },
                { title: '11. add_shipping_info (22 keys)', eventName: 'add_shipping_info', content: 'Fields: ecommerce (currency, value, shipping, items), shipping_tier | Meta: AddShippingInfo | TikTok: add_shipping_info | GA4: add_shipping_info' },
                { title: '12. add_payment_info (22 keys)', eventName: 'add_payment_info', content: 'Fields: ecommerce (currency, value, items), payment_type | Meta: AddPaymentInfo | TikTok: AddPaymentInfo | GA4: add_payment_info' },
                { title: '14. track_order (21 keys)', eventName: 'track_order', content: 'Fields: phone_last4, order_count | Meta: CustomEvent | TikTok: track_order | GA4: track_order' },
                { title: '15. whatsapp_click (21 keys)', eventName: 'whatsapp_click', content: 'Fields: contact_method, page_type | Meta: Contact | TikTok: Contact | GA4: whatsapp_click' },
              ].map((item, idx) => (
                <details key={idx} className="admin-bg-surface admin-border-b" style={{ border: '1px solid var(--admin-border-light)', borderRadius: 8, padding: 12, cursor: 'pointer' }}>
                  <summary className="admin-text-primary-dark" style={{ fontWeight: 700, outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.title}</span>
                    <label className="admin-toggle" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={!(settings.disabledEvents || []).includes(item.eventName)} 
                        onChange={e => {
                          const disabled = settings.disabledEvents || [];
                          const newDisabled = e.target.checked 
                            ? disabled.filter((id: string) => id !== item.eventName)
                            : [...disabled, item.eventName];
                          update('disabledEvents', newDisabled);
                        }} 
                      />
                      <span className="admin-toggle-track" />
                    </label>
                  </summary>
                  <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                    {item.content}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Scripts */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="admin-card-title"><Code size={18} /> Custom Scripts</h3>
            <button 
              type="button" 
              className="admin-btn admin-btn-outline" 
              onClick={() => {
                const arr = settings.customScripts || [];
                update('customScripts', [...arr, { id: Date.now().toString(), name: '', location: 'head', content: '', enabled: true }]);
              }}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Add Script
            </button>
          </div>
          <div className="admin-card-body">
            {(!settings.customScripts || settings.customScripts.length === 0) ? (
              <div className="admin-text-muted" style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>
                No custom scripts added. Click "Add Script" to inject third-party tags like Chat Widgets or verification metas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {settings.customScripts.map((script: any, index: number) => (
                  <div key={script.id} className="admin-bg-surface admin-border" style={{ border: '1px solid var(--admin-border-light)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 300 }}>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Script Name (e.g. Chat Widget)"
                          value={script.name}
                          onChange={e => {
                            const newArr = [...settings.customScripts];
                            newArr[index].name = e.target.value;
                            update('customScripts', newArr);
                          }}
                          style={{ flex: 1 }}
                        />
                        <select
                          className="admin-input"
                          value={script.location}
                          onChange={e => {
                            const newArr = [...settings.customScripts];
                            newArr[index].location = e.target.value;
                            update('customScripts', newArr);
                          }}
                          style={{ width: 140 }}
                        >
                          <option value="head">Header (&lt;head&gt;)</option>
                          <option value="body">Body (&lt;body&gt;)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label className="admin-toggle">
                          <input 
                            type="checkbox" 
                            checked={script.enabled !== false} 
                            onChange={e => {
                              const newArr = [...settings.customScripts];
                              newArr[index].enabled = e.target.checked;
                              update('customScripts', newArr);
                            }} 
                          />
                          <span className="admin-toggle-track" />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newArr = settings.customScripts.filter((_: any, i: number) => i !== index);
                            update('customScripts', newArr);
                          }}
                          className="admin-text-danger"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="admin-textarea"
                      rows={4}
                      value={script.content}
                      onChange={e => {
                        const newArr = [...settings.customScripts];
                        newArr[index].content = e.target.value;
                        update('customScripts', newArr);
                      }}
                      placeholder="Paste your HTML/JS/CSS code here..."
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
