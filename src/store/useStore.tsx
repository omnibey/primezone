import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Initial state, optionally loaded from localStorage if needed later
// We will manage Cart, Checkout UI, and Settings here

const useStore = create(persist((set) => ({
  // UI STATES
  isMobileNavOpen: false,
  setMobileNavOpen: (isOpen) => set({ isMobileNavOpen: isOpen }),
  
  // TOASTS
  toasts: [],
  addToast: (message, type = 'success') => set((state) => {
    const id = Date.now();
    return {
      toasts: [...state.toasts, { id, message, type }]
    };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // CART STATE
  cartItems: [],
  isCartOpen: false,
  addToCart: (product, quantity = 1, variant = null) => set((state) => {
    const existingIndex = state.cartItems.findIndex(
      (item) => item.id === product.id && item.variant === variant
    );
    
    if (existingIndex >= 0) {
      const updatedCart = [...state.cartItems];
      updatedCart[existingIndex].quantity += quantity;
      return { cartItems: updatedCart };
    }
    
    return {
      cartItems: [
        ...state.cartItems,
        { ...product, quantity, variant }
      ]
    };
  }),
  updateCartItem: (index, quantityChange) => set((state) => {
    const updatedCart = [...state.cartItems];
    updatedCart[index].quantity = Math.max(1, updatedCart[index].quantity + quantityChange);
    return { cartItems: updatedCart };
  }),
  removeFromCart: (index) => set((state) => {
    const updatedCart = [...state.cartItems];
    updatedCart.splice(index, 1);
    return { cartItems: updatedCart };
  }),
  clearCart: () => set({ cartItems: [] }),
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

  // CHECKOUT STATE
  isCheckoutOpen: false,
  checkoutSource: 'cart', // 'cart' or 'buy_now'
  checkoutItems: [], // items actively being checked out
  setCheckoutItems: (items) => set({ checkoutItems: items }),
  setCheckoutSource: (source) => set({ checkoutSource: source }),
  openCheckout: (source = 'cart', items = null) => set((state) => {
    return {
      isCheckoutOpen: true,
      isCartOpen: false, // close cart if open
      checkoutSource: source,
      checkoutItems: source === 'buy_now' && items ? items : state.cartItems
    };
  }),
  setCheckoutOpen: (isOpen) => set({ isCheckoutOpen: isOpen }),
  updateCheckoutItem: (index, quantityChange) => set((state) => {
    const targetArray = state.checkoutSource === 'cart' ? [...state.cartItems] : [...state.checkoutItems];
    
    if (!targetArray[index]) return state; // Guard against undefined
    
    targetArray[index].quantity = Math.max(1, targetArray[index].quantity + quantityChange);
    
    if (state.checkoutSource === 'cart') {
      return { checkoutItems: targetArray, cartItems: targetArray };
    }
    // 'buy_now' or 'selected_cart' — only update checkoutItems
    return { checkoutItems: targetArray };
  }),
  removeCheckoutItem: (index) => set((state) => {
    const targetArray = state.checkoutSource === 'cart' ? [...state.cartItems] : [...state.checkoutItems];
    
    if (!targetArray[index]) return state; // Guard against undefined
    
    targetArray.splice(index, 1);
    
    if (state.checkoutSource === 'cart') {
      return { checkoutItems: targetArray, cartItems: targetArray };
    }
    // 'buy_now' or 'selected_cart' — only update checkoutItems
    return { checkoutItems: targetArray };
  }),

  // SETTINGS STATE (Delivery fees, global settings)
  settings: {
    delivery: { insideFee: 70, outsideFee: 120 }
  },
  setSettings: (newSettings) => set({ settings: newSettings })
}), {
  name: 'store-cart-storage',
  partialize: (state: any) => ({ cartItems: state.cartItems }),
}));

export default useStore;
