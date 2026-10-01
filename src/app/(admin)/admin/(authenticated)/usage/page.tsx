'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Database, HardDrive, Activity, Server, AlertCircle } from 'lucide-react';

export default function UsagePage() {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await adminFetch('/usage');
        setUsage(data.usage || data || {});
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load usage data.');
        showToast('Failed to load usage data. Check setup instructions.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadUsage();
  }, [showToast]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercentage = (used, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  const getColorClass = (percent) => {
    if (percent >= 90) return 'danger';
    if (percent >= 75) return 'warning';
    return '';
  };

  // Mock limits if not provided by API
  const d1ReadsTotal = 100000;
  const d1WritesTotal = 100000;
  const r2StorageTotal = 10 * 1024 * 1024 * 1024; // 10 GB
  const workersRequestsTotal = 100000;

  const stats = [
    {
      title: 'Database Storage (D1)',
      icon: <Database size={20} />,
      color: '#3b82f6',
      used: usage?.d1?.usedBytes || 0,
      total: usage?.d1?.limitBytes || d1ReadsTotal,
      format: formatBytes,
      suffix: '',
    },
    {
      title: 'Database Writes (D1) - Simulated',
      icon: <Database size={20} />,
      color: '#10b981',
      used: usage?.d1?.writes || 0,
      total: usage?.d1?.writesLimit || d1WritesTotal,
      format: (v) => v.toLocaleString(),
      suffix: ' writes',
    },
    {
      title: 'Storage Space (R2)',
      icon: <HardDrive size={20} />,
      color: '#8b5cf6',
      used: usage?.r2?.usedBytes || 0,
      total: usage?.r2?.limitBytes || r2StorageTotal,
      format: formatBytes,
      suffix: '',
    },
    {
      title: 'API Requests (Workers)',
      icon: <Server size={20} />,
      color: '#f59e0b',
      used: usage?.workers?.dailyRequests || 0,
      total: usage?.workers?.limitRequests || workersRequestsTotal,
      format: (v) => v.toLocaleString(),
      suffix: ' requests',
    },
  ];

  if (loading) {
    return <div className="admin-grid-2">{Array(4).fill(0).map((_, i) => <div key={i} className="admin-card"><div className="admin-card-body"><div className="admin-skeleton admin-skeleton-text-lg" style={{ width: '60%', marginBottom: 16 }} /><div className="admin-skeleton" style={{ height: 10, borderRadius: 10 }} /></div></div>)}</div>;
  }

  return (
    <div>
      {errorMsg && (
        <div style={{ marginBottom: 24, padding: '20px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--admin-danger)', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <AlertCircle size={24} color="var(--admin-danger)" />
            <h3 style={{ margin: 0, color: 'var(--admin-danger)', fontSize: '1.1rem' }}>Setup Required: API Credentials Missing</h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
            The Usage API requires a Cloudflare API Token to fetch your D1 and R2 usage data. Please follow these steps to configure it:
          </p>
          <div style={{ background: 'var(--bg-light)', padding: 16, borderRadius: 8, fontSize: '0.85rem', color: '#334155' }}>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <strong>Create API Token:</strong> Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noreferrer" style={{ color: 'var(--admin-primary)', textDecoration: 'underline' }}>Cloudflare API Tokens</a> and click <strong>Create Token</strong> &gt; <strong>Custom Token</strong>.
              </li>
              <li>
                <strong>Set Permissions:</strong> Grant the following permissions for <strong>All accounts</strong>:
                <ul style={{ marginTop: 4, paddingLeft: 20, color: '#64748b' }}>
                  <li>Account &gt; D1 &gt; Read</li>
                  <li>Account &gt; Worker R2 Storage &gt; Read</li>
                </ul>
              </li>
              <li>
                <strong>Add Secret to Worker:</strong> Open your terminal, navigate to the <code>worker</code> folder, and run:<br />
                <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>npx wrangler secret put CLOUDFLARE_API_TOKEN</code><br />
                <em>(Paste the generated token when prompted)</em>
              </li>
              <li>
                <strong>Deploy Worker:</strong> Finally, deploy the worker to apply the secret:<br />
                <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>npm run deploy</code>
              </li>
            </ol>
          </div>
        </div>
      )}

      <div className="admin-bg-info-light admin-border-info" style={{ marginBottom: 24, padding: '16px', borderRadius: '12px', border: '1px solid', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertCircle size={20} className="admin-text-info" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <h4 className="admin-text-info-dark" style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 600 }}>Cloudflare Usage Limits</h4>
          <p className="admin-text-info-darker" style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.5 }}>
            These metrics show your current usage against Cloudflare's free tier limits. They reset monthly. If you exceed these limits, you may need to upgrade your Cloudflare plan.
          </p>
        </div>
      </div>

      <div className="admin-grid-2">
        {stats.map((stat, i) => {
          const percent = getPercentage(stat.used, stat.total);
          const colorClass = getColorClass(percent);
          
          return (
            <div key={i} className="admin-card">
              <div className="admin-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {stat.icon}
                  </div>
                  <h3 className="admin-card-title">{stat.title}</h3>
                </div>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                  <div>
                    <div className="admin-text-primary-dark" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                      {stat.format(stat.used)}
                      <span className="admin-text-muted" style={{ fontSize: '0.8rem', fontWeight: 500, marginLeft: 4 }}>{stat.suffix}</span>
                    </div>
                  </div>
                  <div className="admin-text-muted" style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 500 }}>
                    of {stat.format(stat.total)}
                  </div>
                </div>
                
                <div className="admin-progress">
                  <div 
                    className={`admin-progress-bar ${colorClass}`} 
                    style={{ width: `${percent}%`, background: colorClass ? undefined : stat.color }} 
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', fontWeight: 600 }}>
                  <span className={percent >= 90 ? 'admin-text-danger' : percent >= 75 ? 'admin-text-warning' : 'admin-text-success'}>
                    {percent}% Used
                  </span>
                  <span className="admin-text-muted">
                    {(100 - percent)}% Remaining
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
