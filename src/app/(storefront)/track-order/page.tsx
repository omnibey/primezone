"use client";
export const runtime = 'edge';

import { useState, useEffect, Suspense } from "react";
import { pushPageView, pushTrackOrder } from "@/lib/dataLayer";
import { usePathname, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/formatPrice";
import Link from "next/link";

function TrackOrderContent() {
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    pushPageView("track_order", fullUrl);
    
    // Auto-fill from localStorage if available
    try {
      const saved = localStorage.getItem("store_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        if (profile.phone) {
          setPhone(profile.phone);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Auto-fill from URL params ?order_id=...&phone=...
    const urlOrderId = searchParams.get('order_id') || searchParams.get('orderId');
    const urlPhone = searchParams.get('phone');
    if (urlOrderId) setOrderId(urlOrderId);
    if (urlPhone) setPhone(urlPhone);
  }, []);

  const handleCopyOrderId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!orderId || orderId.trim() === "") {
      setError("Please enter your Order ID");
      return;
    }
    if (!phone || phone.trim().length < 11) {
      setError("Please enter a valid 11-digit phone number (e.g. 017XXXXXXXX)");
      return;
    }
    
    setLoading(true);
    setError("");
    setHasSearched(true);
    
    try {
      const res = await fetch(`/api/v1/orders/track?phone=${encodeURIComponent(phone.trim())}&order_id=${encodeURIComponent(orderId.trim())}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOrder(data.data.order);
        const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
        pushTrackOrder(phone.trim(), 1, fullUrl);
      } else {
        setError(data.message || "No order found matching this Order ID and Phone Number.");
        setOrder(null);
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your internet and try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Stepper Stage
  const getStepStatus = (orderStatus) => {
    const s = (orderStatus || '').toLowerCase();
    if (s.includes('cancel')) return -1;
    if (s.includes('deliver')) return 4;
    if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) return 3;
    if (s.includes('process') || s.includes('confirm')) return 2;
    return 1; // Pending / Placed
  };

  const stepNumber = order ? getStepStatus(order.status) : 0;

  return (
    <div className="track-order-page-wrapper">
      <div className="track-order-container">
        
        {/* HERO HEADER */}
        <div className="track-hero-header">
          <div className="track-icon-badge">
            <i className="ph-bold ph-truck"></i>
          </div>
          <h1>Track Your Order</h1>
          <p>Enter your Order ID and Phone Number to see real-time shipment updates</p>
        </div>

        {/* SEARCH FORM CARD */}
        <div className="track-search-card">
          <form className="track-form-grid" onSubmit={handleTrack}>
            <div className="track-input-group">
              <label htmlFor="trackOrderId">Order ID</label>
              <div className="track-input-wrap">
                <i className="ph-bold ph-hash track-field-icon"></i>
                <input 
                  type="text" 
                  id="trackOrderId" 
                  className="track-text-input" 
                  placeholder="e.g. ORD-2026-XXXX" 
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="track-input-group">
              <label htmlFor="trackPhone">Phone Number</label>
              <div className="track-input-wrap">
                <i className="ph-bold ph-phone track-field-icon"></i>
                <input 
                  type="tel" 
                  id="trackPhone" 
                  className="track-text-input" 
                  placeholder="01XXXXXXXXX" 
                  pattern="01[3-9][0-9]{8}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary track-submit-btn" 
              id="trackBtn" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="ph-bold ph-spinner ph-spin"></i> Tracking Order...
                </>
              ) : (
                <>
                  <i className="ph-bold ph-magnifying-glass"></i> Track Order
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="track-error-banner" id="trackError">
              <i className="ph-bold ph-warning-circle"></i>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {hasSearched && !loading && order && (
          <div className="track-results-container" id="trackResults">
            
            {/* 1. ORDER SUMMARY TOP BAR */}
            <div className="track-order-topbar">
              <div className="track-topbar-left">
                <span className="track-label">ORDER ID</span>
                <div className="track-order-id-row">
                  <span className="track-id-text">{order.order_id}</span>
                  <button 
                    type="button" 
                    className="track-copy-btn" 
                    onClick={() => handleCopyOrderId(order.order_id)}
                    title="Copy Order ID"
                  >
                    <i className={`ph-bold ${copied ? 'ph-check' : 'ph-copy'}`}></i>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <span className="track-date-text">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="track-topbar-right">
                <span className={`status-pill status-${order.status}`}>
                  <span className="status-dot"></span>
                  {order.status}
                </span>
              </div>
            </div>

            {/* 2. PROGRESS STEPPER */}
            {stepNumber === -1 ? (
              <div className="track-cancelled-box">
                <i className="ph-bold ph-x-circle"></i>
                <div>
                  <strong>Order Cancelled</strong>
                  <p>This order has been cancelled. For queries, please reach out to our customer support.</p>
                </div>
              </div>
            ) : (
              <div className="track-stepper-card">
                <h3 className="track-card-heading">
                  <i className="ph-bold ph-path"></i> Shipment Progress
                </h3>
                <div className="track-stepper-flow">
                  {/* Step 1 */}
                  <div className={`track-step-node ${stepNumber >= 1 ? 'completed' : ''} ${stepNumber === 1 ? 'current' : ''}`}>
                    <div className="step-icon-circle">
                      <i className="ph-bold ph-shopping-bag"></i>
                    </div>
                    <span className="step-label">Order Placed</span>
                  </div>

                  <div className={`track-step-line ${stepNumber >= 2 ? 'completed' : ''}`}></div>

                  {/* Step 2 */}
                  <div className={`track-step-node ${stepNumber >= 2 ? 'completed' : ''} ${stepNumber === 2 ? 'current' : ''}`}>
                    <div className="step-icon-circle">
                      <i className="ph-bold ph-package"></i>
                    </div>
                    <span className="step-label">Processing</span>
                  </div>

                  <div className={`track-step-line ${stepNumber >= 3 ? 'completed' : ''}`}></div>

                  {/* Step 3 */}
                  <div className={`track-step-node ${stepNumber >= 3 ? 'completed' : ''} ${stepNumber === 3 ? 'current' : ''}`}>
                    <div className="step-icon-circle">
                      <i className="ph-bold ph-truck"></i>
                    </div>
                    <span className="step-label">Shipped</span>
                  </div>

                  <div className={`track-step-line ${stepNumber >= 4 ? 'completed' : ''}`}></div>

                  {/* Step 4 */}
                  <div className={`track-step-node ${stepNumber >= 4 ? 'completed' : ''} ${stepNumber === 4 ? 'current' : ''}`}>
                    <div className="step-icon-circle">
                      <i className="ph-bold ph-seal-check"></i>
                    </div>
                    <span className="step-label">Delivered</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. DETAILS DUAL COLUMN GRID */}
            <div className="track-details-grid">
              
              {/* LEFT COLUMN: DELIVERY & HELP */}
              <div className="track-details-left">
                {/* Delivery Address Card */}
                <div className="track-info-card">
                  <div className="track-card-header">
                    <i className="ph-bold ph-map-pin"></i>
                    <h3>Delivery Address</h3>
                  </div>
                  <div className="track-card-body">
                    <p className="track-recipient-name">{order.customer_name}</p>
                    <p className="track-recipient-phone">
                      <i className="ph-bold ph-phone"></i> {order.phone}
                    </p>
                    <p className="track-recipient-address">
                      {order.address}{order.city ? `, ${order.city}` : ''}
                    </p>
                    <div className="track-payment-badge">
                      <span className="track-meta-label">Payment Method:</span>
                      <span className="track-meta-val">{order.payment_method?.toUpperCase() || 'COD'}</span>
                    </div>
                  </div>
                </div>

                {/* Support Card */}
                <div className="track-help-card">
                  <div className="track-help-content">
                    <i className="ph-bold ph-headset track-help-icon"></i>
                    <div>
                      <h4>Need Help with this Order?</h4>
                      <p>Our dedicated support team is here to assist you anytime.</p>
                    </div>
                  </div>
                  <div className="track-help-actions">
                    <Link href="/contact" className="btn btn-outline track-help-btn">
                      <i className="ph-bold ph-chat-circle-dots"></i> Helpline
                    </Link>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ITEMS & FINANCIAL SUMMARY */}
              <div className="track-details-right">
                <div className="track-info-card">
                  <div className="track-card-header">
                    <i className="ph-bold ph-basket"></i>
                    <h3>Order Items ({order.items?.length || 0})</h3>
                  </div>
                  
                  {/* Items List */}
                  <div className="track-items-list">
                    {order.items?.map((item, idx) => (
                      <div className="track-item-row" key={idx}>
                        <div className="track-item-thumb">
                          <img 
                            src={item.images?.[0] || item.image || 'https://placehold.co/80'} 
                            alt={item.title} 
                          />
                        </div>
                        <div className="track-item-meta">
                          <h4 className="track-item-name">{item.title}</h4>
                          {(item.variantName || item.variant) && (
                            <span className="track-item-variant">
                              {item.variantName || item.variant}
                            </span>
                          )}
                          <div className="track-item-calc">
                            {item.quantity} × ৳{formatPrice(item.price)}
                          </div>
                        </div>
                        <div className="track-item-total">
                          ৳{formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="track-financial-summary">
                    <div className="track-finance-line">
                      <span>Subtotal</span>
                      <span>৳{formatPrice(order.subtotal || order.total_amount)}</span>
                    </div>
                    <div className="track-finance-line">
                      <span>Delivery Fee</span>
                      <span>৳{formatPrice(order.delivery_fee || 0)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="track-finance-line discount">
                        <span>Discount</span>
                        <span>-৳{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="track-finance-grand-total">
                      <span>Grand Total</span>
                      <span className="grand-total-val">৳{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackOrder() {
  return (
    <Suspense fallback={<div className="track-order-page-wrapper"><div className="track-order-container" style={{ minHeight: '60vh' }}></div></div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
