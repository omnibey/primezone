import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  variantId?: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  sku?: string;
  slug?: string;
  stock?: number;
  max_quantity?: number;
  originalPrice?: number;
}

interface CartStore {
  items: CartItem[];
  buyNowItems: CartItem[];
  checkoutMode: "cart" | "buy_now";
  isDrawerOpen: boolean;
  toggleDrawer: (isOpen?: boolean) => void;
  setCheckoutMode: (mode: "cart" | "buy_now") => void;
  setBuyNowItems: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, variantId: string | undefined, delta: number | string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getActiveItems: () => CartItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      buyNowItems: [], // Items specifically for Buy Now
      checkoutMode: "cart", // "cart" or "buy_now"
      isDrawerOpen: false,
      
      toggleDrawer: (isOpen) => set({ isDrawerOpen: isOpen !== undefined ? isOpen : !get().isDrawerOpen }),
      
      setCheckoutMode: (mode) => set({ checkoutMode: mode }),
      
      setBuyNowItems: (items) => set({ 
        buyNowItems: items,
        checkoutMode: "buy_now"
      }),

      addToCart: (item) => set((state) => {
        const existingItem = state.items.find(
          i => i.id === item.id && i.variantId === item.variantId
        );
        
        if (existingItem) {
          return {
            items: state.items.map(i => 
              (i.id === item.id && i.variantId === item.variantId)
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
            checkoutMode: "cart"
          };
        }
        
        return { 
          items: [...state.items, item],
          checkoutMode: "cart"
        };
      }),

      addToCartBulk: (items) => set((state) => {
        let newItems = [...state.items];
        
        items.forEach(newItem => {
          const existingIdx = newItems.findIndex(i => i.id === newItem.id && i.variantId === newItem.variantId);
          if (existingIdx > -1) {
            newItems[existingIdx] = { 
              ...newItems[existingIdx], 
              quantity: newItems[existingIdx].quantity + newItem.quantity 
            };
          } else {
            newItems.push(newItem);
          }
        });
        
        return { items: newItems, checkoutMode: "cart" };
      }),
      
      removeFromCart: (itemId, variantId) => set((state) => {
        if (state.checkoutMode === "buy_now") {
          return {
            buyNowItems: state.buyNowItems.filter(i => !(i.id === itemId && i.variantId === variantId))
          };
        }
        return {
          items: state.items.filter(i => !(i.id === itemId && i.variantId === variantId))
        };
      }),
      
      updateQuantity: (itemId, variantId, delta) => set((state) => {
        const updateList = (list) => list.map(i => {
          if (i.id === itemId && i.variantId === variantId) {
            const newQ = Math.max(1, i.quantity + Number(delta));
            return { ...i, quantity: newQ };
          }
          return i;
        });

        if (state.checkoutMode === "buy_now") {
          return { buyNowItems: updateList(state.buyNowItems) };
        }
        return { items: updateList(state.items) };
      }),
      
      clearCart: () => set({ items: [] }),
      
      getCartTotal: () => {
        const state = get();
        const activeItems = state.checkoutMode === "buy_now" ? state.buyNowItems : state.items;
        return activeItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getActiveItems: () => {
        const state = get();
        return state.checkoutMode === "buy_now" ? state.buyNowItems : state.items;
      }
    }),
    {
      name: 'store-cart-storage',
    }
  )
);
