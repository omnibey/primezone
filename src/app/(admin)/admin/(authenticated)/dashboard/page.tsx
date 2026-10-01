'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/adminApi';
import { DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await adminFetch('/dashboard');
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    const map = {
      pending: 'admin-badge-pending', processing: 'admin-badge-processing',
      shipped: 'admin-badge-shipped', delivered: 'admin-badge-delivered',
      cancelled: 'admin-badge-cancelled', returned: 'admin-badge-returned',
    };
    return map[s] || 'admin-badge-draft';
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  if (error) {
    return (
      <div className="admin-card admin-border-danger">
        <div className="admin-card-body admin-text-danger" style={{ textAlign: 'center' }}>
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Revenue", value: `৳${(stats?.todayRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'emerald' },
    { label: "Today's Orders", value: stats?.todayOrders || 0, icon: ShoppingBag, color: 'indigo' },
    { label: "Total Pending", value: stats?.pendingOrders || 0, icon: Clock, color: 'amber' },
    { label: "Revenue (7d)", value: `৳${(stats?.weekRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'sky' },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="admin-grid-4" style={{ marginBottom: '24px' }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="admin-stat-card">
              <div className="admin-skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <div className="admin-skeleton admin-skeleton-text" style={{ width: '60%' }} />
                <div className="admin-skeleton admin-skeleton-text-lg" style={{ width: '40%' }} />
              </div>
            </div>
          ))
        ) : statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="admin-stat-card">
              <div className={`admin-stat-icon ${card.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="admin-stat-label">{card.label}</div>
                <div className="admin-stat-value">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Orders</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j}><div className="admin-skeleton admin-skeleton-text" style={{ width: `${60 + Math.random() * 40}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-text-muted" style={{ textAlign: 'center', padding: '32px' }}>
                    No recent orders found.
                  </td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order.order_id}>
                  <td className="admin-text-primary-dark" style={{ fontWeight: 600 }}>#{order.order_id}</td>
                  <td>{order.customer_name}</td>
                  <td style={{ fontWeight: 600 }}>৳{order.total_amount?.toLocaleString()}</td>
                  <td>
                    <span className={`admin-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="admin-text-muted">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
