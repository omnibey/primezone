"use client";

import useStore from "@/store/useStore";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { pushViewCart, pushRemoveFromCart } from "@/lib/dataLayer";
import { formatPrice } from "@/lib/formatPrice";

export default function CartDrawer() {
  const isCartOpen = useStore((state) => state.isCartOpen);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const cartItems = useStore((state) => state.cartItems);
  const updateCartItem = useStore((state) => state.updateCartItem);
  const removeFromCart = useStore((state) => state.removeFromCart);
  
  const router = useRouter();
  const pathname = usePathname();

  // Selection state — all selected by default
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  // Sync selection when cart opens or items change
  useEffect(() => {
    setSelectedIndexes(new Set(cartItems.map((_, i) => i)));
  }, [cartItems.length, isCartOpen]);

  // Pre-fetch checkout route in idle time (after slide-in animation finishes)
  useEffect(() => {
    if (isCartOpen) {
      setIsNavigating(false);
      const timer = setTimeout(() => {
        router.prefetch('/checkout');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isCartOpen, router]);

  // Auto-close cart drawer when route changes to /checkout or any other page
  useEffect(() => {
    if (isCartOpen) {
      setCartOpen(false);
      setIsNavigating(false);
    }
  }, [pathname]);

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

  // GTM Tracking: view_cart
  useEffect(() => {
    if (isCartOpen && cartItems.length > 0) {
      pushViewCart(cartItems, cartItems.reduce((s, i) => s + ((i.price || i.base_price) * i.quantity), 0));
    }
  }, [isCartOpen, cartItems.length]);

  const handleRemove = (index, item) => {
    pushRemoveFromCart(item);
    removeFromCart(index);
  };

  const handleClose = () => {
    setCartOpen(false);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0 || isNavigating) return;
    setIsNavigating(true);
    useStore.setState({ checkoutSource: 'selected_cart', checkoutItems: selectedItems });
    router.push('/checkout');
  };

  const handleStartShopping = () => {
    handleClose();
    router.push('/category');
  };

  return (
    <>
      {/* BACKDROP OVERLAY */}
      <div 
        className={`fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px] transition-opacity duration-400 ease-in-out ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        id="cartDrawerOverlay" 
        onClick={handleClose}
        aria-hidden="true"
      ></div>

      {/* DRAWER CONTAINER */}
      <div 
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`} 
        id="cartDrawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
      >
        {/* 1. HEADER */}
        <div className="cart-drawer-header">
          <div className="cart-header-title-group">
            <div className="cart-header-icon">
              <i className="ph-bold ph-shopping-bag"></i>
            </div>
            <h2>Shopping Cart</h2>
            <span className="cart-header-count-badge">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <button 
            type="button" 
            className="cart-drawer-close" 
            id="cartDrawerCloseBtn" 
            onClick={handleClose}
            aria-label="Close cart"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* 2. SELECT ALL BAR (When items exist) */}
        {cartItems.length > 0 && (
          <div className="cart-select-all-bar">
            <label className="cart-checkbox-label">
              <input
                type="checkbox"
                id="cartDrawerSelectAll"
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
        )}

        {/* 3. BODY & ITEMS LIST */}
        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-drawer-empty-premium">
              <div className="empty-cart-icon-wrap">
                <div className="empty-cart-glow"></div>
                <i className="ph-bold ph-shopping-bag-open empty-cart-main-icon"></i>
              </div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added any products to your bag yet.</p>
              <button 
                type="button" 
                className="btn btn-primary empty-cart-cta-btn"
                onClick={handleStartShopping}
              >
                <i className="ph-bold ph-sparkle"></i> Start Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-wrapper">
              {cartItems.map((item, index) => {
                const price = item.price || item.base_price;
                const regularPrice = item.regular_price || item.compare_price || 0;
                const isSelected = selectedIndexes.has(index);

                return (
                  <div 
                    className={`cart-drawer-item-card ${isSelected ? 'is-selected' : ''}`} 
                    key={index}
                  >
                    {/* Item Checkbox */}
                    <div className="cart-item-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(index)}
                        className="cart-custom-checkbox"
                        aria-label={`Select ${item.title}`}
                      />
                    </div>

                    {/* Product Thumbnail */}
                    <div className="cart-item-thumb-box">
                      <img 
                        src={item.images?.[0] || item.image || 'https://placehold.co/80'} 
                        alt={item.title} 
                        className="cart-item-thumb" 
                      />
                    </div>

                    {/* Product Meta */}
                    <div className="cart-item-content">
                      <div className="cart-item-header-row">
                        <h4 className="cart-item-name">{item.title}</h4>
                        <button 
                          type="button" 
                          className="cart-item-trash-btn" 
                          onClick={() => handleRemove(index, item)}
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      </div>

                      {/* Variant Badge & SKU */}
                      <div className="cart-item-meta-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {(item.variantName || item.variant) && (
                          <div className="cart-item-variant-pill">
                            <i className="ph-bold ph-tag"></i>
                            <span>{item.variantName || item.variant}</span>
                          </div>
                        )}
                        {item.sku && (
                          <div className="cart-item-variant-pill" style={{ background: 'var(--bg-light)', color: 'var(--text-light)', border: '1px solid var(--border-color)' }}>
                            <i className="ph-bold ph-barcode"></i>
                            <span>SKU: {item.sku}</span>
                          </div>
                        )}
                      </div>

                      {/* Price and Stepper Row */}
                      <div className="cart-item-bottom-row">
                        <div className="cart-item-price-wrap">
                          <span className="cart-current-price">৳{formatPrice(price)}</span>
                          {regularPrice > price && (
                            <span className="cart-strike-price">৳{formatPrice(regularPrice)}</span>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="cart-qty-stepper">
                          <button 
                            type="button"
                            className="stepper-btn"
                            onClick={() => updateCartItem(index, -1)}
                            aria-label="Decrease quantity"
                          >
                            <i className="ph-bold ph-minus"></i>
                          </button>
                          <span className="stepper-count">{item.quantity}</span>
                          <button 
                            type="button"
                            className="stepper-btn"
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
          )}
        </div>
        
        {/* 4. FOOTER: SUBTOTAL & FAST CHECKOUT */}
        {cartItems.length > 0 && (
          <div className='cart-drawer-footer' id='cartDrawerFooter'>
            
            {/* Subtotal Calculation */}
            <div className='cart-drawer-total-box'>
              <div className="subtotal-left">
                <span className="subtotal-label">Subtotal</span>
                <span className="subtotal-item-count">({selectedIndexes.size} items selected)</span>
              </div>
              <div className="subtotal-right">
                <span className='subtotal-amount' id='cartDrawerTotal'>
                  ৳{formatPrice(subtotal)}
                </span>
              </div>
            </div>

            {/* Primary High-Conversion Checkout Button */}
            <button 
              className='btn btn-primary btn-full cd-checkout-btn-modern' 
              id='cartCheckoutBtn' 
              type='button'
              onClick={handleCheckout}
              disabled={selectedIndexes.size === 0 || isNavigating}
            >
              {isNavigating ? (
                <div className="checkout-btn-loading-content">
                  <i className="ph-bold ph-spinner ph-spin"></i>
                  <span>Redirecting to Checkout...</span>
                </div>
              ) : (
                <>
                  <span className="checkout-btn-label">Proceed to Checkout</span>
                  <i className="ph-bold ph-arrow-right checkout-btn-arrow"></i>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
