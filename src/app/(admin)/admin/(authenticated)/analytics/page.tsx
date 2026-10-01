'use client';
export const runtime = 'edge';

import { useEffect, useState, useRef } from 'react';
import { adminFetch } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Eye, Users, ShoppingCart, CreditCard, Package, DollarSign, TrendingUp, Monitor, Smartphone, Tablet, CalendarCheck, Filter } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AnalyticsPage() {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [data, setData] = useState(null);

  const loadAnalytics = async (range) => {
    setLoading(true);
    try {
      const days = range === 'today' ? 1 : parseInt(range.replace('d', ''));
      const res = await adminFetch(`/analytics/overview?days=${days}`);
      setData(res);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAnalytics(dateRange); }, [dateRange]);

  const ranges = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
  ];

  const summary = (data?.summary || data || {}) as any;
  const daily = (data?.daily || []) as any[];
  const sources = (data?.sources || {}) as Record<string, number>;
  const devices = (data?.devices || {}) as Record<string, number>;

  const kpis = [
    { label: 'Page Views', value: summary.views || 0, icon: Eye, color: 'indigo' },
    { label: 'Unique Visitors', value: summary.unique_visitors || 0, icon: Users, color: 'sky' },
    { label: 'Product Views', value: summary.product_views || 0, icon: ShoppingCart, color: 'violet' },
    { label: 'Cart Adds', value: summary.cart_adds || 0, icon: ShoppingCart, color: 'amber' },
    { label: 'Checkouts', value: summary.checkouts || 0, icon: CreditCard, color: 'teal' },
    { label: 'Orders', value: summary.orders || 0, icon: Package, color: 'emerald' },
    { label: 'Revenue', value: `৳${(summary.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'rose' },
  ];

  // Chart Data
  const lineChartData = {
    labels: daily.map(d => {
      try { return new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
      catch { return d.date; }
    }),
    datasets: [
      {
        label: 'Views',
        data: daily.map(d => d.views || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#6366f1',
      },
      {
        label: 'Orders',
        data: daily.map(d => d.orders || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const revenueChartData = {
    labels: daily.map(d => {
      try { return new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
      catch { return d.date; }
    }),
    datasets: [{
      label: 'Revenue (৳)',
      data: daily.map(d => d.revenue || 0),
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const deviceData = {
    labels: Object.keys(devices).length ? Object.keys(devices) : ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: Object.keys(devices).length ? Object.values(devices) : [0, 0, 0],
      backgroundColor: ['#6366f1', '#f43f5e', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } }, beginAtZero: true },
    },
  };

  return (
    <div>
      {/* Date Range Filter & Status */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-card-body" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className={data?.enabled === false ? 'admin-bg-danger' : 'admin-bg-success'} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', animation: data?.enabled !== false ? 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none', opacity: 0.75 }} />
              <div className={data?.enabled === false ? 'admin-bg-danger' : 'admin-bg-success'} style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%' }} />
            </div>
            <div className={data?.enabled === false ? 'admin-bg-danger-light' : 'admin-bg-success-light'} style={{ fontSize: '0.85rem', fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
              {data?.enabled === false ? 'Disabled' : 'Active'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="admin-tabs admin-bg-gray-light" style={{ marginBottom: 0, padding: 4, borderRadius: 8 }}>
              {ranges.map(r => (
                <button key={r.id} className={`admin-tab ${dateRange === r.id ? 'active admin-bg-surface' : ''}`} onClick={() => setDateRange(r.id)} style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: 6, boxShadow: dateRange === r.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                  {r.label}
                </button>
              ))}
            </div>
            {loading && <span className="admin-text-muted" style={{ fontSize: '0.78rem' }}>Loading...</span>}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {loading ? (
          Array(7).fill(0).map((_, i) => (
            <div key={i} className="admin-stat-card">
              <div className="admin-skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div style={{ flex: 1 }}><div className="admin-skeleton admin-skeleton-text" /><div className="admin-skeleton admin-skeleton-text-lg" style={{ width: '50%' }} /></div>
            </div>
          ))
        ) : kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="admin-stat-card">
              <div className={`admin-stat-icon ${kpi.color}`}><Icon size={20} /></div>
              <div><div className="admin-stat-label">{kpi.label}</div><div className="admin-stat-value" style={{ fontSize: '1.25rem' }}>{kpi.value}</div></div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {!loading && daily.length > 0 && (
        <>
          <div className="admin-grid-2" style={{ marginBottom: 20 }}>
          <div className="admin-card" style={{ gridColumn: 'span 2' }}>
            <div className="admin-card-header"><h3 className="admin-card-title"><TrendingUp size={16} /> Traffic & Orders Trend</h3></div>
            <div className="admin-card-body">
              <div className="admin-chart-container">
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="admin-card" style={{ gridColumn: 'span 1' }}>
            <div className="admin-card-header"><h3 className="admin-card-title"><Filter size={16} style={{ color: '#10b981' }} /> Conversion Funnel</h3></div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(data?.funnel || [
                  { stage: 'Page Views', count: summary.views || 0 },
                  { stage: 'Product Views', count: summary.product_views || 0 },
                  { stage: 'Add to Cart', count: summary.cart_adds || 0 },
                  { stage: 'Initiate Checkout', count: summary.checkouts || 0 },
                  { stage: 'Purchases', count: summary.orders || 0 }
                ]).map((step, idx) => {
                  const max = (data?.funnel?.[0]?.count || summary.views || 1);
                  const percent = Math.min(Math.round((step.count / (max > 0 ? max : 1)) * 100), 100);
                  const colors = ['var(--admin-primary)', 'var(--admin-info)', 'var(--admin-secondary)', 'var(--admin-warning)', 'var(--admin-success)'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                        <span>{step.stage}</span>
                        <span>{step.count.toLocaleString()} <span style={{ fontWeight: 'normal', color: 'var(--admin-text-muted)' }}>({percent}%)</span></span>
                      </div>
                      <div style={{ height: 10, background: 'var(--admin-bg)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="admin-grid-2" style={{ marginBottom: 20 }}>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><DollarSign size={16} /> Revenue</h3></div>
            <div className="admin-card-body">
              <div className="admin-chart-container">
                <Bar data={revenueChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Sources & Devices */}
      {!loading && (
        <div className="admin-grid-2">
          {/* Traffic Sources */}
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Traffic Sources</h3></div>
            <div className="admin-card-body">
              {Object.keys(sources).length === 0 ? (
                <div className="admin-empty-state" style={{ padding: 20 }}><p>No source data available</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
                    const total = Object.values(sources).reduce((s, v) => s + v, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={source}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500, color: 'var(--admin-text)', textTransform: 'capitalize' }}>{source}</span>
                          <span style={{ color: 'var(--admin-text-muted)' }}>{count} ({pct}%)</span>
                        </div>
                        <div className="admin-progress">
                          <div className="admin-progress-bar" style={{ width: `${pct}%`, background: '#6366f1' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Devices</h3></div>
            <div className="admin-card-body">
              {Object.keys(devices).length === 0 ? (
                <div className="admin-empty-state" style={{ padding: 20 }}><p>No device data available</p></div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 160, height: 160 }}>
                    <Doughnut data={deviceData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, cutout: '65%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    {Object.entries(devices).map(([device, count], i) => {
                      const icons = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet };
                      const colors = ['#6366f1', '#f43f5e', '#f59e0b'];
                      const Icon = icons[device] || Monitor;
                      return (
                        <div key={device} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[i % 3] }} />
                          <Icon size={14} style={{ color: 'var(--admin-text-muted)' }} />
                          <span style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 500, flex: 1 }}>{device}</span>
                          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Breakdown Table */}
      {!loading && daily.length > 0 && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title"><CalendarCheck size={16} /> Daily Breakdown</h3>
          </div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Unique Visitors</th>
                    <th>Total Views</th>
                    <th>Product Views</th>
                    <th>Add to Cart</th>
                    <th>Checkouts</th>
                    <th>Orders</th>
                    <th>Revenue (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {(() => {
                          try { return new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
                          catch { return row.date; }
                        })()}
                      </td>
                      <td>{(row.unique_visitors || 0).toLocaleString()}</td>
                      <td>{(row.views || 0).toLocaleString()}</td>
                      <td>{(row.product_views || 0).toLocaleString()}</td>
                      <td>{(row.cart_adds || 0).toLocaleString()}</td>
                      <td>{(row.checkouts || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>{(row.orders || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 700 }}>৳{(row.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
