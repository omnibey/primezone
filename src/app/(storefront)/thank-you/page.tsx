"use client";
export const runtime = 'edge';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import useStore from "@/store/useStore";
import { formatPrice } from "@/lib/formatPrice";
import { pushPageView, pushPurchase } from "@/lib/dataLayer";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const orderId = searchParams.get("order_id");
  const [orderData, setOrderData] = useState(null);
  const settings = useStore((state) => state.settings);
  const whatsappNumber = settings?.whatsapp_number || "";

  useEffect(() => {
    const fullUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    pushPageView("thank_you", fullUrl);
  }, [pathname, searchParams]);

  useEffect(() => {
    try {
      const storedOrder = localStorage.getItem("store_latest_order");
      if (storedOrder) {
        const order = JSON.parse(storedOrder);
        if (order.order_id === orderId) {
          setOrderData(order);
          
          // Get user info for Enhanced Conversions
          const storedProfile = localStorage.getItem("store_profile");
          const user = storedProfile ? JSON.parse(storedProfile) : {
            firstName: order.customer_name,
            phone: order.phone,
            city: order.city,
            address: order.address,
            email: order.email
          };

          const fullThankYouUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/thank-you?order_id=${encodeURIComponent(order.order_id || orderId || '')}`
            : "";

          // Trigger purchase event
          pushPurchase(
            order,
            order.items || [],
            (order.subtotal || 0) + (order.delivery_fee || 0) - (order.discount_amount || 0),
            order.subtotal || 0,
            order.delivery_fee || 0,
            order.payment_method || 'cod',
            order.delivery_area || 'outside',
            user,
            fullThankYouUrl
          );
        }
      }
    } catch (err) {
      console.error("Failed to parse order details:", err);
    }
  }, [orderId]);

  const waLink = `https://wa.me/${whatsappNumber}${orderId ? `?text=${encodeURIComponent('Hello, I need help with my order: ' + orderId)}` : ''}`;

  return (
    <div className="container">
      <div className="thank-you-container">
        {/* Animated Checkmark */}
        <div className="success-animation">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h1 className="ty-title">Thank You!</h1>
        <p className="ty-subtitle">Your order has been placed successfully.</p>

        <div className="ty-order-id-box" id="tyOrderIdBox">
          Order ID: <span id="tyOrderId">{orderId || "Unknown"}</span>
        </div>

        {orderData && (
          <div className="ty-summary-box" id="tySummaryBox" style={{ display: 'block' }}>
            <h3><i className="ph-bold ph-receipt"></i> Order Summary</h3>
            
            <div id="tyCustomerDetails" style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              <strong>Name:</strong> {orderData.customer_name}<br />
              <strong>Phone:</strong> {orderData.phone}<br />
              <strong>Address:</strong> {orderData.address}, {orderData.thana}, {orderData.city}
            </div>

            <div id="tyOrderItems" style={{ marginBottom: '1rem' }}>
              {orderData.items?.map((item, idx) => (
                <div key={idx} className="ty-row" style={{ color: 'var(--text-color)' }}>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span>{item.quantity} x {item.title} {item.variantName ? `(${item.variantName})` : ''} @ ৳{formatPrice(item.price)}</span>
                    {item.sku && <span style={{fontSize: '0.75rem', color: 'var(--text-light)'}}>SKU: {item.sku}</span>}
                  </div>
                  <span>৳{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="ty-row"><span>Subtotal:</span><span id="tySubtotal">৳{formatPrice(orderData.subtotal)}</span></div>
            <div className="ty-row"><span>Delivery Fee:</span><span id="tyDelivery">৳{formatPrice(orderData.delivery_fee)}</span></div>
            
            {(orderData.discount_amount || 0) > 0 && (
              <div className="ty-row" id="tyDiscountRow" style={{ color: '#10B981' }}>
                <span>Discount:</span><span id="tyDiscount">-৳{formatPrice(orderData.discount_amount)}</span>
              </div>
            )}
            
            <div className="ty-row total">
              <span>Total Paid/Payable:</span>
              <span id="tyTotal">৳{formatPrice((orderData.subtotal || 0) + (orderData.delivery_fee || 0) - (orderData.discount_amount || 0))}</span>
            </div>
            
            <div className="ty-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <span>Payment Method:</span>
              <span id="tyPaymentMethod" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
              </span>
            </div>
          </div>
        )}

        <div className="ty-actions">
          <Link href="/" className="btn btn-orange" style={{ textDecoration: 'none' }}>
            <i className="ph-bold ph-shopping-bag"></i> Continue Shopping
          </Link>
          <a href={waLink} id="tyWhatsappBtn" target="_blank" rel="noreferrer" className="btn btn-whatsapp" style={{ textDecoration: 'none' }}>
            <i className="ph-bold ph-whatsapp-logo"></i> WhatsApp Support
          </a>
        </div>

        {/* NEXT STEPS */}
        {orderData?.payment_method === 'full' ? (
          <div className="ty-next-steps" id="tyNextSteps" style={{ marginTop: '2rem', marginBottom: 0 }}>
            <h4><i className="ph-bold ph-check-circle"></i> Payment Received</h4>
            <p style={{ fontSize: '0.95rem', marginBottom: 0 }}>আপনার পেমেন্ট ভেরিফাই করা হচ্ছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনাকে কনফার্ম করবেন।</p>
          </div>
        ) : (
          <div className="ty-next-steps" id="tyNextSteps" style={{ marginTop: '2rem', marginBottom: 0 }}>
            <h4><i className="ph-bold ph-info"></i> পরবর্তী ধাপ</h4>
            <p style={{ fontSize: '0.95rem', marginBottom: 0 }}>আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনাকে কল করে অর্ডারটি কনফার্ম করবেন। অনুগ্রহ করে আপনার ফোনটি চালু রাখুন।</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .thank-you-container {
            max-width: 600px;
            margin: 0.75rem auto 2rem;
            padding: 2rem;
            background: var(--bg-color);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow);
            text-align: center;
        }
        
        .success-animation {
            width: 100px;
            height: 100px;
            margin: 0 auto 1.5rem;
        }

        .checkmark-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #10B981;
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            margin: 10% auto;
            box-shadow: inset 0px 0px 0px #10B981;
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }

        .checkmark-check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }

        @keyframes stroke {
            100% {
                stroke-dashoffset: 0;
            }
        }
        @keyframes scale {
            0%, 100% {
                transform: none;
            }
            50% {
                transform: scale3d(1.1, 1.1, 1);
            }
        }
        @keyframes fill {
            100% {
                box-shadow: inset 0px 0px 0px 100px #10B981;
            }
        }
        
        .ty-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-color);
            margin-bottom: 0.5rem;
        }
        
        .ty-subtitle {
            font-size: 1.1rem;
            color: var(--text-light);
            margin-bottom: 2rem;
        }
        
        .ty-order-id-box {
            background: var(--bg-light);
            border: 1px dashed #D1D5DB;
            padding: 1rem;
            border-radius: var(--radius);
            margin-bottom: 2rem;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary-color);
        }
        
        .ty-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }

        .ty-summary-box {
            background-color: var(--bg-light);
            border: 1px solid #E2E8F0;
            border-radius: var(--radius);
            padding: 1.5rem;
            margin-bottom: 2rem;
            text-align: left;
            display: none;
        }

        .ty-summary-box h3 {
            margin-bottom: 1rem;
            font-size: 1.2rem;
            color: var(--text-color);
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 0.5rem;
        }

        .ty-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            color: var(--text-light);
            font-size: 0.95rem;
        }

        .ty-row.total {
            font-weight: 700;
            color: var(--text-color);
            font-size: 1.1rem;
            border-top: 1px dashed #E2E8F0;
            padding-top: 0.5rem;
            margin-top: 0.5rem;
        }

        .ty-next-steps {
            background: #ECFDF5;
            border: 1px solid #A7F3D0;
            padding: 1rem;
            border-radius: var(--radius);
            margin-bottom: 2rem;
            text-align: left;
            color: #065F46;
        }

        .ty-next-steps h4 {
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .btn-whatsapp {
            background: #25D366;
            color: white;
        }
        .btn-whatsapp:hover {
            background: #128C7E;
            color: white;
        }

        .btn-orange {
            background: var(--primary-color);
            color: white;
            border: none;
        }
        .btn-orange:hover {
            background: color-mix(in srgb, var(--primary-color) 85%, black);
            color: white;
        }
        
        @media (max-width: 600px) {
            .ty-actions {
                flex-direction: column;
                gap: 0.5rem;
            }
            .thank-you-container {
                margin: 0.5rem;
                padding: 1rem;
            }
            .success-animation {
                width: 70px;
                height: 70px;
                margin: 0 auto 0.75rem;
            }
            .checkmark {
                width: 70px;
                height: 70px;
            }
            @keyframes fill {
                100% {
                    box-shadow: inset 0px 0px 0px 70px #10B981;
                }
            }
            .ty-title { font-size: 1.6rem; margin-bottom: 0.25rem; }
            .ty-subtitle { font-size: 0.95rem; margin-bottom: 1rem; }
            .ty-order-id-box { padding: 0.75rem; font-size: 1.1rem; margin-bottom: 1rem; }
            .ty-summary-box { padding: 1rem; margin-bottom: 1rem; }
            .ty-next-steps { padding: 0.75rem; margin-top: 1.5rem; margin-bottom: 0; }
        }
      `}</style>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "5rem" }}>Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
