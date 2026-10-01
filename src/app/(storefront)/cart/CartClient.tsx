"use client";

import useStore from "@/store/useStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { pushRemoveFromCart, pushViewCart } from "@/lib/dataLayer";
import { formatPrice } from "@/lib/formatPrice";

export default function CartClient() {
  const router = useRouter();
  const cartItems = useStore((state: any) => state.cartItems);
  const updateCartItem = useStore((state: any) => state.updateCartItem);
  const removeFromCart = useStore((state: any) => state.removeFromCart);

  // Selection state — all selected by default
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setSelectedIndexes(new Set(cartItems.map((_, i) => i)));
    router.prefetch('/checkout');
  }, [cartItems.length, router]);

  // GTM view_cart
  useEffect(() => {
    if (cartItems.length > 0) {
      const total = cartItems.reduce((s, i) => s + ((i.price || i.base_price) * i.quantity), 0);
      pushViewCart(cartItems, total);
    }
  }, [cartItems.length]);

  const isAllSelected = cartItems.length > 0 && selectedIndexes.size === cartItems.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIndexes(new Set());
    } else {
      setSelectedIndexes(new Set(cartItems.map((_, i) => i)));
    }
  };

  const toggleItem = (index) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectedItems = cartItems.filter((_, i) => selectedIndexes.has(i));
  const subtotal = selectedItems.reduce((sum, item) => sum + ((item.price || item.base_price) * item.quantity), 0);

  const handleRemove = (index, item) => {
    pushRemoveFromCart(item);
    removeFromCart(index);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0 || isNavigating) return;
    setIsNavigating(true);
    useStore.setState({ checkoutSource: 'selected_cart', checkoutItems: selectedItems });
    router.push('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page-empty-premium">
        <div className="empty-cart-icon-wrap" style={{ margin: '0 auto 1.5rem' }}>
          <div className="empty-cart-glow"></div>
          <i className="ph-bold ph-shopping-bag-open empty-cart-main-icon"></i>
        </div>
        <h2>Your shopping cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet. Explore our genuine products.</p>
        <Link href="/category" className="btn btn-primary empty-cart-cta-btn" style={{ marginTop: '1rem' }}>
          <i className="ph-bold ph-sparkle"></i> Explore All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page-layout-v2">
      {/* LEFT: CART ITEMS */}
      <div className="cart-page-main-v2">
        {/* Header with Select All */}
        <div className="cart-page-header-row">
          <div className="cart-page-title-group">
            <h1>Shopping Cart</h1>
            <span className="cart-items-total-pill">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="cart-select-all-box">
            <label className="cart-checkbox-label">
              <input
                type="checkbox"
                id="pageSelectAll"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="cart-custom-checkbox"
              />
              <span>{isAllSelected ? 'Deselect All' : 'Select All Items'}</span>
            </label>
            {selectedIndexes.size > 0 && (
              <span className="cart-selected-count">
                ({selectedIndexes.size} selected)
              </span>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="cart-page-items-list">
          {cartItems.map((item, index) => {
            const price = item.price || item.base_price;
            const regularPrice = item.regular_price || item.compare_price || 0;
            const isSelected = selectedIndexes.has(index);

            return (
              <div 
                className={`cart-page-item-card ${isSelected ? 'is-selected' : ''}`} 
                key={index}
              >
                {/* Checkbox */}
                <div className="cpi-check-col">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(index)}
                    className="cart-custom-checkbox"
                    aria-label={`Select ${item.title}`}
                  />
                </div>

                {/* Image */}
                <div className="cpi-thumb-col">
                  <img 
                    src={item.images?.[0] || item.image || 'https://placehold.co/100'} 
                    alt={item.title} 
                    className="cpi-thumb-img" 
                  />
                </div>

                {/* Details */}
                <div className="cpi-info-col">
                  <div className="cpi-title-row">
                    <h3 className="cpi-title-text">{item.title}</h3>
                    <button 
                      type="button" 
                      className="cpi-trash-action" 
                      onClick={() => handleRemove(index, item)}
                      aria-label="Remove item"
                      title="Remove item"
                    >
                      <i className="ph-bold ph-trash"></i>
                    </button>
                  </div>

                  {/* Variant Badge */}
                  {(item.variantName || item.variant) && (
                    <div className="cpi-variant-badge">
                      <i className="ph-bold ph-tag"></i>
                      <span>{item.variantName || item.variant}</span>
                    </div>
                  )}
                  
                  {/* Price & Stepper Row */}
                  <div className="cpi-bottom-action-row">
                    <div className="cpi-pricing-group">
                      <span className="cpi-main-price">৳{formatPrice(price)}</span>
                      {regularPrice > price && (
                        <span className="cpi-old-price">৳{formatPrice(regularPrice)}</span>
                      )}
                    </div>
                    
                    {/* Stepper */}
                    <div className="cpi-stepper-wrap">
                      <button 
                        type="button" 
                        className="cpi-stepper-btn"
                        onClick={() => updateCartItem(index, -1)} 
                        aria-label="Decrease quantity"
                      >
                        <i className="ph-bold ph-minus"></i>
                      </button>
                      <span className="cpi-stepper-val">{item.quantity}</span>
                      <button 
                        type="button" 
                        className="cpi-stepper-btn"
                        onClick={() => updateCartItem(index, 1)} 
                        aria-label="Increase quantity"
                      >
                        <i className="ph-bold ph-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Continue Shopping Link */}
        <div style={{ marginTop: '1.25rem' }}>
          <Link href="/category" className="cart-continue-link">
            <i className="ph-bold ph-arrow-left"></i> Continue Shopping
          </Link>
        </div>
      </div>

      {/* RIGHT: ORDER SUMMARY SIDEBAR */}
      <div className="cart-page-sidebar-v2">
        <div className="cart-order-summary-box">
          <h2 className="summary-card-title">Order Summary</h2>

          <div className="summary-line-item">
            <span>Selected Items</span>
            <span className="summary-value-bold">{selectedIndexes.size} / {cartItems.length}</span>
          </div>

          <div className="summary-line-item">
            <span>Subtotal</span>
            <span className="summary-value-amount">৳{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-delivery-note">
            <i className="ph-bold ph-info"></i>
            <span>Delivery charge will be calculated at checkout.</span>
          </div>
          
          <button 
            type="button"
            className="btn btn-primary btn-full cart-page-checkout-btn"
            onClick={handleCheckout}
            disabled={selectedIndexes.size === 0 || isNavigating}
          >
            {isNavigating ? (
              <span className="checkout-btn-loading-content">
                <i className="ph-bold ph-spinner ph-spin"></i>
                <span>Redirecting to Checkout...</span>
              </span>
            ) : (
              <>
                <span className="checkout-btn-label">Proceed to Checkout</span>
                <i className="ph-bold ph-arrow-right checkout-btn-arrow"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
