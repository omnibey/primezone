'use client';
export const runtime = 'edge';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminFetch, invalidateAdminCache } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Search, Eye, Printer, Edit, ChevronLeft, ChevronRight, X, Phone, Mail, MapPin, CreditCard, Package, RefreshCw } from 'lucide-react';
import OrderLogs from '@/components/admin/OrderLogs';

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let endpoint = `/orders?page=${page}&limit=20`;
      if (statusFilter !== 'All') endpoint += `&status=${statusFilter}`;
      if (search.trim()) endpoint += `&search=${encodeURIComponent(search.trim())}`;
      
      const data = await adminFetch(endpoint);
      setOrders(data.orders || data || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalOrders(data.pagination?.total || data.total || (data.orders || data || []).length);
      setCurrentPage(page);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  const handlePageChange = (page: number) => {
    loadOrders(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (page !== currentPage) {
      loadOrders(page);
    }
  }, [searchParams, currentPage, loadOrders]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    loadOrders(page);
  }, [statusFilter, loadOrders, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders(1);
  };

  const openOrderDetail = async (orderId) => {
    try {
      const data = await adminFetch(`/orders/${orderId}`);
      setSelectedOrder(data.order || data);
      setModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    let restock = false;
    if (newStatus === 'Cancelled' || newStatus === 'Returned') {
      restock = window.confirm(`Restock items from order #${orderId}?`);
    }

    setUpdatingStatus(true);
    try {
      await adminFetch(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, restock }),
      });
      showToast(`Order updated to ${newStatus}`);
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);
      loadOrders(currentPage);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };


  const getStatusClass = (status) => {
    const map = {
      pending: 'admin-badge-pending', processing: 'admin-badge-processing',
      shipped: 'admin-badge-shipped', delivered: 'admin-badge-delivered',
      cancelled: 'admin-badge-cancelled', returned: 'admin-badge-returned',
    };
    return map[(status || '').toLowerCase()] || 'admin-badge-draft';
  };

  const formatDate = (d) => {
    try { return new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

  const printInvoice = async (orderId) => {
    try {
      const data = await adminFetch(`/orders/${orderId}`);
      const o = data.order;
      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${o.order_id}</title>
      <style>
          body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:700px;margin:0 auto;}
          h1{color:#FF6B35;} table{width:100%;border-collapse:collapse;margin:20px 0;}
          th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left;}
          th{background:#f9f9f9;} .totals{text-align:right;margin-top:20px;}
          .totals p{margin:5px 0;} .header{border-bottom:2px solid #FF6B35;margin-bottom:30px;padding-bottom:20px;}
          @media print{button{display:none}}
      </style></head><body onload="window.print()">
      <div class="header"><h1>INVOICE</h1><p>Invoice #${o.order_id} &nbsp;|&nbsp; ${new Date(o.created_at.replace(" ", "T") + "Z").toLocaleDateString()}</p></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
          <div><strong>Bill To:</strong><br>${o.customer_name}<br>${o.phone}<br>${o.address}<br>${[o.city,o.thana].filter(Boolean).join(', ')}</div>
          <div><strong>Payment:</strong> ${o.payment_method.toUpperCase()}<br><strong>Status:</strong> ${o.status}</div>
      </div>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
      ${(typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []).map(i=>`<tr><td>${i.title || i.name}${i.variantName?` (${i.variantName})`:''}</td><td>${i.quantity || i.qty}</td><td>৳${i.price}</td><td>৳${i.price*(i.quantity || i.qty)}</td></tr>`).join('')}
      </tbody></table>
      <div class="totals">
          <p>Subtotal: ৳${o.subtotal}</p>
          <p>Delivery: ৳${o.delivery_fee}</p>
          ${o.discount_amount>0?`<p>Discount (${o.coupon_code||''}): -৳${o.discount_amount}</p>`:''}
          <h2 style="color:#FF6B35;">Total: ৳${o.total_amount}</h2>
      </div></body></html>`);
      win.document.close();
    } catch (err) {
      showToast('Failed to load invoice: ' + err.message, 'error');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '16px' }}>
        <div className="admin-card-body" style={{ padding: '14px 16px' }}>
          <form onSubmit={handleSearch} className="admin-filter-bar" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders (ID, Name, Phone)..."
                className="admin-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              style={{ minWidth: 140 }}
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
            <button type="submit" className="admin-btn admin-btn-primary">
              <Search size={15} /> Search
            </button>
          </form>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="admin-card-title">
            Orders
            <span className="admin-bg-gray-light" style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, marginLeft: '8px' }}>
              {totalOrders}
            </span>
          </h3>
          <button 
            className="admin-btn admin-btn-secondary admin-btn-sm" 
            onClick={() => {
              invalidateAdminCache('orders');
              loadOrders(1);
            }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Items</th>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="admin-skeleton admin-skeleton-text" style={{ width: `${50 + Math.random() * 50}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty-state">
                    <Package size={40} style={{ opacity: 0.3 }} />
                    <p>No orders found</p>
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.order_id || order.id}>
                  <td>
                    <div className="admin-text-primary-dark" style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {order.id}
                    </div>
                  </td>
                  <td style={{ minWidth: '220px', maxWidth: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(() => {
                        const itemsList = typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items || '[]'); } catch(e) { return []; } })() : order.items || [];
                        return itemsList.map((item: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: idx !== itemsList.length - 1 ? '6px' : '0', borderBottom: idx !== itemsList.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                            {item.image ? (
                              <img src={item.image} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--admin-border)', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={14} style={{ opacity: 0.3 }} />
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <div className="admin-text-primary-dark" style={{ fontSize: '0.75rem', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }} title={item.title || item.name || item.product_name}>
                                {item.title || item.name || item.product_name || 'Item'}
                              </div>
                              <div className="admin-text-muted" style={{ fontSize: '0.7rem', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <span>ID: {item.product_id || item.id || '-'}</span>
                                {item.sku && (
                                  <>
                                    <span style={{ fontSize: '10px' }}>•</span>
                                    <span>SKU: {item.sku}</span>
                                  </>
                                )}
                                {(item.variant || item.variantName) && (
                                  <>
                                    <span style={{ fontSize: '10px' }}>•</span>
                                    <span>{item.variant || item.variantName}</span>
                                  </>
                                )}
                                <span style={{ fontSize: '10px' }}>•</span>
                                <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>Qty: {item.quantity || item.qty || 1}</span>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </td>
                  <td>
                    <div className="admin-text-primary-dark" style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      #{order.order_id}
                    </div>
                    {order.source && (
                      <div className="admin-text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                        Source: {order.source}
                      </div>
                    )}
                  </td>
                  <td className="admin-text-muted" style={{ fontSize: '0.82rem' }}>{formatDate(order.created_at)}</td>
                  <td>
                    <div className="admin-text-primary-dark" style={{ fontWeight: 500 }}>{order.customer_name}</div>
                    <div className="admin-text-muted" style={{ fontSize: '0.75rem' }}>{order.phone}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>৳{order.total_amount?.toLocaleString()}</td>
                  <td>
                    <select
                      className={`admin-badge ${getStatusClass(order.status)}`}
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      disabled={updatingStatus}
                      style={{ 
                        border: 'none', 
                        cursor: 'pointer', 
                        outline: 'none', 
                        fontWeight: 600,
                        padding: '4px 8px'
                      }}
                    >
                      {statuses.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s} style={{ background: 'var(--bg-body, #111827)', color: 'var(--text-primary, #fff)' }}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => openOrderDetail(order.order_id || order.id)}
                        title="View Order"
                      >
                        <Eye size={15} /> View
                      </button>
                      <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => printInvoice(order.order_id || order.id)}
                        title="Print Invoice"
                      >
                        <Printer size={15} /> Print
                      </button>
                      <Link
                        href={`/admin/add-order/${order.id || order.order_id}`}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        title="Edit Order"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Edit size={15} /> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
            <div className="admin-pagination">
              <button className="admin-page-btn" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
                <ChevronLeft size={16} />
              </button>
              {(() => {
                const pages = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else if (currentPage <= 4) {
                  pages.push(1, 2, 3, 4, 5, '...', totalPages);
                } else if (currentPage >= totalPages - 3) {
                  pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                }
                
                return pages.map((page, index) => {
                  if (page === '...') {
                    return <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: '#94a3b8' }}>...</span>;
                  }
                  return (
                    <button 
                      key={page} 
                      className={`admin-page-btn ${currentPage === page ? 'active' : ''}`} 
                      onClick={() => handlePageChange(page as number)}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
              <button className="admin-page-btn" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {modalOpen && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Order {selectedOrder.id} - #{selectedOrder.order_id}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link 
                  href={`/admin/add-order/${selectedOrder.id || selectedOrder.order_id}`} 
                  className="admin-btn admin-btn-ghost admin-btn-sm" 
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit size={15} /> Edit
                </Link>
                <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => printInvoice(selectedOrder.order_id || selectedOrder.id)}>
                  <Printer size={15} />
                </button>
                <button className="admin-modal-close" onClick={() => setModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="admin-modal-body">
              {/* Customer Info */}
              <div className="admin-grid-2" style={{ marginBottom: 20 }}>
                <div className="admin-card" style={{ border: '1px solid var(--admin-border)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text)' }}>Customer</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{selectedOrder.customer_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--admin-text-muted)' }}>
                        <Phone size={14} /> {selectedOrder.phone}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Mail size={14} style={{ color: 'var(--admin-text-muted)' }} />
                      <div style={{ color: 'var(--admin-text-muted)' }}>{selectedOrder.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--admin-text-muted)' }}>
                      <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div>{selectedOrder.address}</div>
                        <div>{selectedOrder.city}{selectedOrder.zone ? `, ${selectedOrder.zone}` : ''}</div>
                        {selectedOrder.courier_name && (
                          <span style={{ display: 'block', fontSize: '0.75rem', marginTop: 2, color: 'var(--admin-text)' }}>
                            Courier: <strong>{selectedOrder.courier_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-card" style={{ border: '1px solid var(--admin-border)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text)' }}>Payment</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CreditCard size={13} />
                        <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{selectedOrder.payment_method}</span>
                        <span style={{ color: 'var(--admin-text-muted)' }}>via {selectedOrder.payment_provider}</span>
                      </div>
                      {selectedOrder.trx_id && (
                        <div style={{ color: 'var(--admin-text-muted)' }}>TrxID: {selectedOrder.trx_id}</div>
                      )}
                      {selectedOrder.sender_number && (
                        <div style={{ color: 'var(--admin-text-muted)' }}>Sender: {selectedOrder.sender_number}</div>
                      )}
                      <div>
                        <span className={`admin-badge ${selectedOrder.payment_status === 'Verified' ? 'admin-badge-delivered' : 'admin-badge-pending'}`}>
                          {selectedOrder.payment_status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', paddingBottom: 12, borderBottom: '1px solid var(--admin-border)', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ color: 'var(--admin-text-muted)' }}>Subtotal: ৳{selectedOrder.subtotal}</div>
                          <div style={{ color: 'var(--admin-text-muted)' }}>Delivery: ৳{selectedOrder.delivery_fee}</div>
                        </div>
                        {selectedOrder.discount_amount > 0 && (
                          <div style={{ color: 'var(--admin-danger)' }}>
                            Discount {selectedOrder.coupon_code && <span style={{ background: 'var(--admin-danger-bg)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{selectedOrder.coupon_code}</span>}: -৳{selectedOrder.discount_amount}
                          </div>
                        )}
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: '1rem', marginTop: 4 }}>
                          Total: ৳{selectedOrder.total_amount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="admin-card" style={{ border: '1px solid var(--admin-border)', marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
                  <h4 className="admin-card-title" style={{ fontSize: '0.85rem' }}>Order Items</h4>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items || []).map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {item.image && (
                                <img src={item.image} alt="" className="admin-image-preview" style={{ width: 40, height: 40 }} />
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontWeight: 500, color: 'var(--admin-text)' }}>
                                  {item.title || item.name || item.product_name || 'Unknown Product'}
                                  {item.is_preorder ? <span style={{ background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)', border: '1px solid var(--admin-danger)', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', marginLeft: 6, fontWeight: 700 }}>Pre-order</span> : null}
                                </div>
                                {item.sku && <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>SKU: {item.sku}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--admin-text-muted)' }}>{item.variant || item.variantName || '-'}</td>
                          <td>৳{item.price}</td>
                          <td>{item.quantity || item.qty}</td>
                          <td style={{ fontWeight: 600 }}>৳{(item.price * (item.quantity || item.qty)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update */}
              <div className="admin-card" style={{ border: '1px solid var(--admin-border)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text)' }}>
                    Update Status
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map(s => (
                      <button
                        key={s}
                        className={`admin-btn admin-btn-sm ${selectedOrder.status === s ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        disabled={updatingStatus || selectedOrder.status === s}
                        onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--admin-warning-bg)', borderRadius: 8, border: '1px solid var(--admin-warning)', fontSize: '0.84rem', color: 'var(--admin-warning-text)' }}>
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}

              {/* Order Logs */}
              <OrderLogs orderId={selectedOrder.order_id || selectedOrder.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="admin-loading"><div className="admin-spinner"></div></div>}>
      <OrdersContent />
    </Suspense>
  );
}
