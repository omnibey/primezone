'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Save, CreditCard, Wallet, HelpCircle, DollarSign, Globe } from 'lucide-react';

export default function PaymentSettingsPage() {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch('/settings/all');
        const s = data?.settings || data || {};
        setSettings(s.payments || {});
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({ payments: settings }),
      });
      showToast('Payment settings saved!');
      await triggerRevalidate('settings');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-card">
        <div className="admin-card-body">
          <div className="admin-skeleton admin-skeleton-text-lg" style={{ width: '40%', marginBottom: 16 }} />
          <div className="admin-skeleton admin-skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
          <div className="admin-skeleton admin-skeleton-text" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="admin-page-title"><CreditCard size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Payment Methods</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Cash on Delivery */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title"><Wallet size={18} /> Cash on Delivery (COD)</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.cod_enabled ?? true} onChange={e => update('cod_enabled', e.target.checked)} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Cash on Delivery</span>
            </label>
            <div className="admin-form-group">
              <label className="admin-label">COD Instructions</label>
              <textarea 
                className="admin-textarea" 
                rows={3} 
                value={settings.cod_instructions || ''} 
                onChange={e => update('cod_instructions', e.target.value)} 
                placeholder="Instructions displayed to the customer during checkout"
              />
            </div>
          </div>
        </div>

        {/* Manual Payments (Send Money) */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title"><CreditCard size={18} /> Manual Payments (Send Money)</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.manual_enabled ?? false} onChange={e => update('manual_enabled', e.target.checked)} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Manual Send Money</span>
            </label>
            <div className="admin-form-group">
              <label className="admin-label">Instructions for Customer</label>
              <textarea className="admin-textarea" rows={2} value={settings.manual_instructions || 'Please send the exact amount to the following number and provide your sender number below.'} onChange={e => update('manual_instructions', e.target.value)} />
            </div>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">bKash Number</label>
                <input type="text" className="admin-input" value={settings.manual_bkash || ''} onChange={e => update('manual_bkash', e.target.value)} placeholder="017XXXXXXXX (Personal)" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Nagad Number</label>
                <input type="text" className="admin-input" value={settings.manual_nagad || ''} onChange={e => update('manual_nagad', e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Rocket Number</label>
                <input type="text" className="admin-input" value={settings.manual_rocket || ''} onChange={e => update('manual_rocket', e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Upay Number</label>
                <input type="text" className="admin-input" value={settings.manual_upay || ''} onChange={e => update('manual_upay', e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
            </div>
          </div>
        </div>

        {/* bKash Direct API */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/gateways/bkash.png" alt="bKash" style={{ height: 24, background: 'var(--bg-color)', padding: '2px 4px', borderRadius: 4 }} />
            <h3 className="admin-card-title">bKash (Tokenized API)</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.bkash_api?.enabled ?? false} onChange={e => update('bkash_api', { ...settings.bkash_api, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable bKash Gateway</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.bkash_api?.is_live ?? false} onChange={e => update('bkash_api', { ...settings.bkash_api, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">App Key</label>
                <input type="text" className="admin-input" value={settings.bkash_api?.app_key || ''} onChange={e => update('bkash_api', { ...settings.bkash_api, app_key: e.target.value })} placeholder="bKash App Key" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">App Secret</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['bkash_secret'] ? "text" : "password"} className="admin-input" value={settings.bkash_api?.app_secret || ''} onChange={e => update('bkash_api', { ...settings.bkash_api, app_secret: e.target.value })} placeholder="bKash App Secret" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('bkash_secret')}><i className={showSecrets['bkash_secret'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Username</label>
                <input type="text" className="admin-input" value={settings.bkash_api?.username || ''} onChange={e => update('bkash_api', { ...settings.bkash_api, username: e.target.value })} placeholder="bKash Username" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['bkash_pass'] ? "text" : "password"} className="admin-input" value={settings.bkash_api?.password || ''} onChange={e => update('bkash_api', { ...settings.bkash_api, password: e.target.value })} placeholder="bKash Password" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('bkash_pass')}><i className={showSecrets['bkash_pass'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nagad Direct API */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/gateways/nagad.svg" alt="Nagad" style={{ height: 24, background: 'var(--bg-color)', padding: '2px 4px', borderRadius: 4 }} />
            <h3 className="admin-card-title">Nagad (Direct API)</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.nagad_api?.enabled ?? false} onChange={e => update('nagad_api', { ...settings.nagad_api, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Nagad Gateway</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.nagad_api?.is_live ?? false} onChange={e => update('nagad_api', { ...settings.nagad_api, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Merchant ID</label>
                <input type="text" className="admin-input" value={settings.nagad_api?.merchant_id || ''} onChange={e => update('nagad_api', { ...settings.nagad_api, merchant_id: e.target.value })} placeholder="Merchant ID" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Merchant Number</label>
                <input type="text" className="admin-input" value={settings.nagad_api?.merchant_number || ''} onChange={e => update('nagad_api', { ...settings.nagad_api, merchant_number: e.target.value })} placeholder="Merchant Number" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Public Key</label>
                <textarea className="admin-textarea" rows={2} value={settings.nagad_api?.public_key || ''} onChange={e => update('nagad_api', { ...settings.nagad_api, public_key: e.target.value })} placeholder="RSA Public Key" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Private Key</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['nagad_pk'] ? "text" : "password"} className="admin-input" value={settings.nagad_api?.private_key || ''} onChange={e => update('nagad_api', { ...settings.nagad_api, private_key: e.target.value })} placeholder="RSA Private Key" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('nagad_pk')}><i className={showSecrets['nagad_pk'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SSLCOMMERZ */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/gateways/ssl-commerz.svg" alt="SSLCOMMERZ" style={{ height: 24, background: 'var(--bg-color)', padding: '2px 4px', borderRadius: 4 }} />
            <h3 className="admin-card-title">SSLCOMMERZ</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.sslcommerz?.enabled ?? false} onChange={e => update('sslcommerz', { ...settings.sslcommerz, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable SSLCOMMERZ Gateway</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.sslcommerz?.is_live ?? false} onChange={e => update('sslcommerz', { ...settings.sslcommerz, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Store ID</label>
                <input type="text" className="admin-input" value={settings.sslcommerz?.store_id || ''} onChange={e => update('sslcommerz', { ...settings.sslcommerz, store_id: e.target.value })} placeholder="Store ID" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Store Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['ssl_pass'] ? "text" : "password"} className="admin-input" value={settings.sslcommerz?.store_password || ''} onChange={e => update('sslcommerz', { ...settings.sslcommerz, store_password: e.target.value })} placeholder="Store Password" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('ssl_pass')}><i className={showSecrets['ssl_pass'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* aamarPay */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/gateways/aamarpay.png" alt="aamarPay" style={{ height: 24, background: 'var(--bg-color)', padding: '2px 4px', borderRadius: 4 }} />
            <h3 className="admin-card-title">aamarPay</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.aamarpay?.enabled ?? false} onChange={e => update('aamarpay', { ...settings.aamarpay, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable aamarPay Gateway</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.aamarpay?.is_live ?? false} onChange={e => update('aamarpay', { ...settings.aamarpay, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Store ID</label>
                <input type="text" className="admin-input" value={settings.aamarpay?.store_id || ''} onChange={e => update('aamarpay', { ...settings.aamarpay, store_id: e.target.value })} placeholder="Store ID" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Signature Key</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['aamar_key'] ? "text" : "password"} className="admin-input" value={settings.aamarpay?.signature_key || ''} onChange={e => update('aamarpay', { ...settings.aamarpay, signature_key: e.target.value })} placeholder="Signature Key" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('aamar_key')}><i className={showSecrets['aamar_key'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* SurjoPay */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/gateways/surjopay.svg" alt="SurjoPay" style={{ height: 24, background: 'var(--bg-color)', padding: '2px 4px', borderRadius: 4 }} />
            <h3 className="admin-card-title">SurjoPay</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.surjopay?.enabled ?? false} onChange={e => update('surjopay', { ...settings.surjopay, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable SurjoPay Gateway</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.surjopay?.is_live ?? false} onChange={e => update('surjopay', { ...settings.surjopay, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Merchant ID</label>
                <input type="text" className="admin-input" value={settings.surjopay?.merchant_id || ''} onChange={e => update('surjopay', { ...settings.surjopay, merchant_id: e.target.value })} placeholder="Merchant ID" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Merchant Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['surjo_pass'] ? "text" : "password"} className="admin-input" value={settings.surjopay?.merchant_password || ''} onChange={e => update('surjopay', { ...settings.surjopay, merchant_password: e.target.value })} placeholder="Merchant Password" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('surjo_pass')}><i className={showSecrets['surjo_pass'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Store ID</label>
                <input type="text" className="admin-input" value={settings.surjopay?.store_id || ''} onChange={e => update('surjopay', { ...settings.surjopay, store_id: e.target.value })} placeholder="Store ID" autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Store Prefix</label>
                <input type="text" className="admin-input" value={settings.surjopay?.store_prefix || ''} onChange={e => update('surjopay', { ...settings.surjopay, store_prefix: e.target.value })} placeholder="Prefix" />
              </div>
            </div>
          </div>
        </div>
        
        {/* EPS */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="admin-card-title"><CreditCard size={18} /> EPS (Easy Payment System)</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.eps?.enabled ?? false} onChange={e => update('eps', { ...settings.eps, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable EPS Gateway</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.eps?.is_live ?? false} onChange={e => update('eps', { ...settings.eps, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Store ID / Merchant ID</label>
                <input type="text" className="admin-input" value={settings.eps?.store_id || ''} onChange={e => update('eps', { ...settings.eps, store_id: e.target.value })} placeholder="Store ID" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Signature Key</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['eps_pass'] ? "text" : "password"} className="admin-input" value={settings.eps?.signature_key || ''} onChange={e => update('eps', { ...settings.eps, signature_key: e.target.value })} placeholder="Signature Key" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('eps_pass')}><i className={showSecrets['eps_pass'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTERNATIONAL PAYMENT GATEWAYS */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginTop: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={20} /> International Payment Gateways
        </h2>
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 16, borderRadius: 8, fontSize: '0.9rem', color: '#1E3A8A', marginBottom: 16 }}>
          <strong>Currency Note:</strong> International gateways (Stripe, PayPal) only support selected currencies like USD. The order total in BDT will be converted to USD based on the exchange rate below.
        </div>
        
        {/* USD Exchange Rate */}
        <div className="admin-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title"><DollarSign size={18} /> USD Exchange Rate</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-form-group" style={{ maxWidth: 300 }}>
              <label className="admin-label">1 USD = ? BDT</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="number" step="0.01" className="admin-input" value={settings.usd_exchange_rate || 120} onChange={e => update('usd_exchange_rate', parseFloat(e.target.value))} placeholder="e.g. 120" />
                <span style={{ fontWeight: 600, color: '#4B5563' }}>BDT</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 6 }}>Used to calculate USD amount for Stripe/PayPal checkout.</p>
            </div>
          </div>
        </div>

        {/* Stripe */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="admin-card-title" style={{ color: '#635BFF' }}>Stripe</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.stripe?.enabled ?? false} onChange={e => update('stripe', { ...settings.stripe, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable Stripe</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.stripe?.is_live ?? false} onChange={e => update('stripe', { ...settings.stripe, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Test Mode)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Publishable Key</label>
                <input type="text" className="admin-input" value={settings.stripe?.public_key || ''} onChange={e => update('stripe', { ...settings.stripe, public_key: e.target.value })} placeholder="pk_live_..." />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Secret Key</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['stripe_secret'] ? "text" : "password"} className="admin-input" value={settings.stripe?.secret_key || ''} onChange={e => update('stripe', { ...settings.stripe, secret_key: e.target.value })} placeholder="sk_live_..." autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('stripe_secret')}><i className={showSecrets['stripe_secret'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PayPal */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="admin-card-title" style={{ color: '#003087' }}>PayPal</h3>
          </div>
          <div className="admin-card-body">
            <label className="admin-toggle" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={settings.paypal?.enabled ?? false} onChange={e => update('paypal', { ...settings.paypal, enabled: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Enable PayPal</span>
            </label>
            <label className="admin-toggle" style={{ marginBottom: 16, marginLeft: 20 }}>
              <input type="checkbox" checked={settings.paypal?.is_live ?? false} onChange={e => update('paypal', { ...settings.paypal, is_live: e.target.checked })} />
              <span className="admin-toggle-track" /><span className="admin-toggle-label">Live Mode (Uncheck for Sandbox)</span>
            </label>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-label">Client ID</label>
                <input type="text" className="admin-input" value={settings.paypal?.client_id || ''} onChange={e => update('paypal', { ...settings.paypal, client_id: e.target.value })} placeholder="PayPal Client ID" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Client Secret</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type={showSecrets['paypal_secret'] ? "text" : "password"} className="admin-input" value={settings.paypal?.secret || ''} onChange={e => update('paypal', { ...settings.paypal, secret: e.target.value })} placeholder="PayPal Secret" autoComplete="new-password" />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSecret('paypal_secret')}><i className={showSecrets['paypal_secret'] ? "ph ph-eye-slash" : "ph ph-eye"}></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
