'use client';
export const runtime = 'edge';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { siteConfig } from '@/config/site';
import { useToast } from '../layout';
import { Save, Store, Truck, Shield, Zap, RefreshCw, MessageCircle, Bot, ShoppingCart, Copy, Eye, EyeOff, Check, CreditCard } from 'lucide-react';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'delivery');
  const [settings, setSettings] = useState<any>({});
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);
  const [mcpTab, setMcpTab] = useState('claude');
  const [showMcpSecret, setShowMcpSecret] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch('/settings/all');
        setSettings(data?.settings || data || {});
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

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      showToast('Settings saved!');
      await triggerRevalidate('settings');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass) return showToast('Fill in all fields', 'error');
    if (passwordForm.newPass !== passwordForm.confirm) return showToast('Passwords do not match', 'error');
    if (passwordForm.newPass.length < 6) return showToast('Min 6 characters', 'error');

    setChangingPass(true);
    try {
      await adminFetch('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.newPass,
        }),
      });
      showToast('Password changed!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err) { showToast(err.message, 'error'); }
    finally { setChangingPass(false); }
  };

  const revalidateTag = async (tag) => {
    try {
      await triggerRevalidate(tag);
      showToast(`Cache cleared: ${tag}`);
    } catch { showToast('Failed', 'error'); }
  };

  const [copiedKey, setCopiedKey] = useState('');
  
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const generateMcpKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = 'store_ai_';
    for (let i = 0; i < 24; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    update('mcp_secret', res);
    showToast('New AI Secret Key generated!', 'success');
  };

  const getMcpSnippet = () => {
    const key = settings.mcp_secret || 'YOUR_ADMIN_SECRET_KEY';
    const mcpEndpointUrl = `${siteConfig.apiUrl}/admin/mcp`;
    if (mcpTab === 'claude') return JSON.stringify({ mcpServers: { "store-admin": { command: "npx", args: ["-y", "mcp-remote", mcpEndpointUrl, "--header", `X-Admin-Key: ${key}`] } } }, null, 2);
    if (mcpTab === 'cursor') return `// In Cursor Settings -> MCP Servers -> Add Server:\nServer URL: ${mcpEndpointUrl}\nHeader Name: X-Admin-Key\nHeader Value: ${key}`;
    if (mcpTab === 'chatgpt') return `// In ChatGPT Custom GPT -> Actions:\n1. Authentication: API Key (Custom Header: X-Admin-Key)\n2. Value: ${key}\n3. Import Schema from: ${mcpEndpointUrl}`;
    if (mcpTab === 'gemini') return `🔵 Gemini Web App → Settings → Custom Apps → Add Custom App\n\nApp Link (MCP URL):\n${mcpEndpointUrl}\n\nClient ID → store-admin\nClient Secret → ${key}\n\nOAuth Discovery URL:\n${mcpEndpointUrl}/.well-known/oauth-authorization-server`;
    if (mcpTab === 'curl') return `curl -X POST "${mcpEndpointUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Admin-Key: ${key}" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;
    return '';
  };

  const tabs = [
    { id: 'delivery', label: 'Delivery & Checkout', icon: Truck },
    { id: 'integrations', label: 'Integrations', icon: MessageCircle },
    { id: 'developer', label: 'AI & Developer', icon: Bot },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'cache', label: 'Cache', icon: Zap },
  ];

  if (loading) {
    return <div className="admin-card"><div className="admin-card-body">{Array(4).fill(0).map((_, i) => <div key={i} className="admin-skeleton admin-skeleton-text-lg" style={{ width: '60%', marginBottom: 16 }} />)}</div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
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
        {activeTab !== 'security' && activeTab !== 'cache' && (
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div style={{ maxWidth: 800 }}>


        {/* Delivery */}
        {activeTab === 'delivery' && (
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><Truck size={18} /> Delivery & Checkout Settings</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Inside Dhaka Fee (৳)</label>
                  <input type="number" className="admin-input" value={settings.delivery_fee_inside || settings?.delivery?.insideFee || ''} onChange={e => update('delivery_fee_inside', e.target.value)} min="0" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Outside Dhaka Fee (৳)</label>
                  <input type="number" className="admin-input" value={settings.delivery_fee_outside || settings?.delivery?.outsideFee || ''} onChange={e => update('delivery_fee_outside', e.target.value)} min="0" />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Free Delivery Threshold (৳)</label>
                <input type="number" className="admin-input" value={settings.free_delivery_threshold || ''} onChange={e => update('free_delivery_threshold', e.target.value)} min="0" />
                <div className="admin-form-hint">Orders above this amount get free delivery. 0 = disabled.</div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Estimated Delivery Time</label>
                <input type="text" className="admin-input" value={settings.delivery_time || ''} onChange={e => update('delivery_time', e.target.value)} placeholder="e.g. 2-5 business days" />
              </div>
              <div className="admin-form-group" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--admin-border)' }}>
                <label className="admin-label">Checkout Rules</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={settings.checkout_rules?.require_thana ?? true} onChange={e => update('checkout_rules', { ...settings.checkout_rules, require_thana: e.target.checked })} />
                    <span className="admin-toggle-track" /><span className="admin-toggle-label">Require Thana/Upazila</span>
                  </label>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={settings.checkout_rules?.require_email ?? false} onChange={e => update('checkout_rules', { ...settings.checkout_rules, require_email: e.target.checked })} />
                    <span className="admin-toggle-track" /><span className="admin-toggle-label">Require Email Address</span>
                  </label>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={settings.checkout_rules?.require_notes ?? false} onChange={e => update('checkout_rules', { ...settings.checkout_rules, require_notes: e.target.checked })} />
                    <span className="admin-toggle-track" /><span className="admin-toggle-label">Require Order Notes</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Integrations */}
        {activeTab === 'integrations' && (<>
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><MessageCircle size={18} /> Telegram Notification Bot</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Telegram Chat ID</label>
                <input type="text" className="admin-input" value={settings.telegram?.chatId || ''} onChange={e => update('telegram', { ...settings.telegram, chatId: e.target.value })} placeholder="e.g. 5876629003" />
                <div className="admin-form-hint">Order alerts will be sent to this chat.</div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Telegram Bot Token</label>
                <input type="password" className="admin-input" value={settings.telegram?.botToken || ''} onChange={e => update('telegram', { ...settings.telegram, botToken: e.target.value })} placeholder="Leave blank to keep existing" />
              </div>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings.telegram?.enabled ?? true} onChange={e => update('telegram', { ...settings.telegram, enabled: e.target.checked })} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Telegram Alerts</span>
              </label>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <div className="admin-card-header"><h3 className="admin-card-title"><Shield size={18} /> Social Login (OAuth)</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-group" style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Google Login</h4>
                <input type="text" className="admin-input" style={{ marginBottom: 8 }} value={settings.oauth?.google?.clientId || ''} onChange={e => update('oauth', { ...settings.oauth, google: { ...settings.oauth?.google, clientId: e.target.value } })} placeholder="Google Client ID" />
                <input type="password" className="admin-input" value={settings.oauth?.google?.clientSecret || ''} onChange={e => update('oauth', { ...settings.oauth, google: { ...settings.oauth?.google, clientSecret: e.target.value } })} placeholder="Google Client Secret" />
              </div>
              
              <div className="admin-form-group" style={{ marginBottom: 16, paddingTop: 16, borderTop: '1px solid var(--admin-border-light)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Facebook Login</h4>
                <input type="text" className="admin-input" style={{ marginBottom: 8 }} value={settings.oauth?.facebook?.clientId || ''} onChange={e => update('oauth', { ...settings.oauth, facebook: { ...settings.oauth?.facebook, clientId: e.target.value } })} placeholder="Facebook App ID" />
                <input type="password" className="admin-input" value={settings.oauth?.facebook?.clientSecret || ''} onChange={e => update('oauth', { ...settings.oauth, facebook: { ...settings.oauth?.facebook, clientSecret: e.target.value } })} placeholder="Facebook App Secret" />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <div className="admin-card-header"><h3 className="admin-card-title"><MessageCircle size={18} /> Universal SMS Gateway (OTP)</h3></div>
            <div className="admin-card-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Configure any Bangladesh SMS Provider (BongoBD, BulkSMSBD, SSLWireless) for Mobile Login OTP.
              </p>
              <div className="admin-form-group" style={{ marginBottom: 12 }}>
                <label className="admin-label">API Endpoint URL</label>
                <input type="text" className="admin-input" value={settings.sms?.endpoint || ''} onChange={e => update('sms', { ...settings.sms, endpoint: e.target.value })} placeholder="https://api.smsprovider.com/send" />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 12 }}>
                <label className="admin-label">HTTP Method</label>
                <select className="admin-input" value={settings.sms?.method || 'POST'} onChange={e => update('sms', { ...settings.sms, method: e.target.value })}>
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </div>
              <div className="admin-form-group" style={{ marginBottom: 12 }}>
                <label className="admin-label">API Headers (JSON format)</label>
                <textarea className="admin-input" rows={3} value={settings.sms?.headers || '{\n  "Content-Type": "application/json"\n}'} onChange={e => update('sms', { ...settings.sms, headers: e.target.value })} placeholder='{"Authorization": "Bearer TOKEN"}' />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 12 }}>
                <label className="admin-label">Payload Template (JSON format)</label>
                <textarea className="admin-input" rows={4} value={settings.sms?.payloadTemplate || '{\n  "to": "{{phone}}",\n  "message": "Your verification code is: {{otp}}"\n}'} onChange={e => update('sms', { ...settings.sms, payloadTemplate: e.target.value })} placeholder='Use {{phone}} and {{otp}} as placeholders' />
              </div>
              <label className="admin-toggle">
                <input type="checkbox" checked={settings.sms?.enabled ?? false} onChange={e => update('sms', { ...settings.sms, enabled: e.target.checked })} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Phone OTP Login</span>
              </label>
            </div>
          </div>
        </>)}

        {/* Developer / AI */}
        {activeTab === 'developer' && (<>

          {/* ── AI Config for Landing Page Builder ── */}
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title"><Zap size={18} /> AI Config — Landing Page Builder</h3>
            </div>
            <div className="admin-card-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Builder-এর &quot;Generate with AI&quot; বাটনের জন্য API key। Key বদলালে কোনো push লাগবে না।
              </p>
              <div className="admin-form-group" style={{ marginBottom: 16 }}>
                <label className="admin-label">AI Provider</label>
                <select className="admin-input" value={settings.ai?.provider || 'gemini'} onChange={e => update('ai', { ...(settings.ai || {}), provider: e.target.value })}>
                  <option value="gemini">Google Gemini (Free tier available)</option>
                  <option value="openrouter">OpenRouter (100+ models — GPT-4o, Claude, etc.)</option>
                </select>
              </div>
              {(settings.ai?.provider || 'gemini') === 'gemini' && (
                <div className="admin-form-group" style={{ marginBottom: 16 }}>
                  <label className="admin-label">
                    Gemini API Key
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--admin-primary)' }}>→ বিনামূল্যে নিন</a>
                  </label>
                  <input type="password" className="admin-input" value={settings.ai?.gemini_key || ''} onChange={e => update('ai', { ...(settings.ai || {}), gemini_key: e.target.value })} placeholder="AIzaSy..." style={{ fontFamily: 'monospace' }} />
                </div>
              )}
              {settings.ai?.provider === 'openrouter' && (
                <div className="admin-form-group" style={{ marginBottom: 16 }}>
                  <label className="admin-label">
                    OpenRouter API Key
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--admin-primary)' }}>→ Key নিন</a>
                  </label>
                  <input type="password" className="admin-input" value={settings.ai?.openrouter_key || ''} onChange={e => update('ai', { ...(settings.ai || {}), openrouter_key: e.target.value })} placeholder="sk-or-v1-..." style={{ fontFamily: 'monospace' }} />
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-label">Model</label>
                <input type="text" className="admin-input" value={settings.ai?.model || ''} onChange={e => update('ai', { ...(settings.ai || {}), model: e.target.value })} placeholder={settings.ai?.provider === 'openrouter' ? 'google/gemini-flash-1.5' : 'gemini-2.0-flash'} style={{ fontFamily: 'monospace' }} />
                <div className="admin-form-hint">
                  {settings.ai?.provider === 'openrouter'
                    ? 'OpenRouter slug — e.g. google/gemini-flash-1.5 | anthropic/claude-3-haiku | openai/gpt-4o-mini'
                    : 'Gemini model — e.g. gemini-2.0-flash | gemini-1.5-pro | gemini-2.0-flash-lite'}
                </div>
              </div>
            </div>
          </div>

          {/* ── MCP Card ── */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title"><Bot size={18} /> AI & Universal Model Context Protocol (MCP)</h3>
              <div className={(settings.mcp_enabled === 'true' || settings.mcp_enabled === true) ? 'admin-bg-success-light admin-text-success admin-border-success' : 'admin-bg-danger-light admin-text-danger admin-border-danger'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, border: '1px solid' }}>
                <span className={(settings.mcp_enabled === 'true' || settings.mcp_enabled === true) ? 'admin-bg-success' : 'admin-bg-danger'} style={{ width: 6, height: 6, borderRadius: '50%' }} />
                {(settings.mcp_enabled === 'true' || settings.mcp_enabled === true) ? 'MCP Active' : 'MCP Disabled'}
              </div>
            </div>
            <div className="admin-card-body">
              <label className="admin-toggle" style={{ marginBottom: 16 }}>
                <input type="checkbox" checked={settings.mcp_enabled === 'true' || settings.mcp_enabled === true} onChange={e => update('mcp_enabled', e.target.checked)} />
                <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable AI Admin API (Master On/Off Switch)</span>
              </label>
              
              <div className="admin-form-group">
                <label className="admin-label">Admin MCP Endpoint URL (JSON-RPC 2.0)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="admin-input admin-bg-surface admin-text-info" value={`${siteConfig.apiUrl}/admin/mcp`} readOnly style={{ fontFamily: 'monospace' }} />
                  <button className="admin-btn admin-btn-secondary" onClick={() => handleCopy(`${siteConfig.apiUrl}/admin/mcp`, "endpoint")}>
                    {copiedKey === 'endpoint' ? <Check size={16} /> : <Copy size={16} />} Copy
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="admin-label" style={{ marginBottom: 0 }}>AI Admin Secret Key (Header: X-Admin-Key)</label>
                  <button className="admin-text-btn admin-text-info" onClick={generateMcpKey} style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <RefreshCw size={14} /> Generate New Key
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type={showMcpSecret ? "text" : "password"} className="admin-input admin-text-warning" value={settings.mcp_secret || ''} onChange={e => update('mcp_secret', e.target.value)} placeholder="store-ai-admin-key-..." style={{ fontFamily: 'monospace', paddingRight: 40 }} />
                    <button className="admin-text-muted" style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowMcpSecret(!showMcpSecret)}>
                      {showMcpSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button className="admin-btn admin-btn-secondary" onClick={() => handleCopy(settings.mcp_secret || '', "secret")}>
                    {copiedKey === 'secret' ? <Check size={16} /> : <Copy size={16} />} Copy
                  </button>
                </div>
              </div>

              <div className="admin-border-t" style={{ marginTop: 24, paddingTop: 20 }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Connection Snippets</h4>
                <div className="admin-tabs" style={{ marginBottom: 12 }}>
                  {[
                    { id: 'claude', label: 'Claude' },
                    { id: 'cursor', label: 'Cursor' },
                    { id: 'chatgpt', label: 'ChatGPT' },
                    { id: 'gemini', label: 'Gemini' },
                    { id: 'curl', label: 'cURL' }
                  ].map(tab => (
                    <button key={tab.id} className={`admin-tab ${mcpTab === tab.id ? 'active' : ''}`} onClick={() => setMcpTab(tab.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <pre className="admin-bg-primary-dark" style={{ color: '#e2e8f0', padding: 16, borderRadius: 8, fontSize: '0.85rem', overflowX: 'auto', whiteSpace: 'pre-wrap', minHeight: 120 }}>
                    {getMcpSnippet()}
                  </pre>
                  <button style={{ position: 'absolute', top: 10, right: 10, background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleCopy(getMcpSnippet(), "snippet")}>
                    {copiedKey === 'snippet' ? <Check size={14} /> : <Copy size={14} />} Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>)}


        {/* Security */}
        {activeTab === 'security' && (
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><Shield size={18} /> Change Password</h3></div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Current Password</label>
                <input type="password" className="admin-input" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">New Password</label>
                <input type="password" className="admin-input" value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Confirm New Password</label>
                <input type="password" className="admin-input" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button className="admin-btn admin-btn-danger" onClick={changePassword} disabled={changingPass}>
                {changingPass ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Cache */}
        {activeTab === 'cache' && (
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><Zap size={18} /> Cache Management</h3></div>
            <div className="admin-card-body">
              <p className="admin-text-muted" style={{ fontSize: '0.84rem', marginBottom: 16 }}>
                Manually clear Next.js cache to reflect latest changes on the live site.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['settings', 'products', 'categories', 'pages'].map(tag => (
                  <button key={tag} className="admin-btn admin-btn-secondary" onClick={() => revalidateTag(tag)}>
                    <RefreshCw size={14} /> Clear {tag}
                  </button>
                ))}
                <button className="admin-btn admin-btn-danger" onClick={() => { if(confirm('Clear all cache completely?')) revalidateTag('all'); }}>
                  <RefreshCw size={14} /> Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="admin-loading"><div className="admin-spinner"></div></div>}>
      <SettingsContent />
    </Suspense>
  );
}
