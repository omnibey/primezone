import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushAddToWishlist, pushRemoveFromWishlist } from './dataLayer';

interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string;
  slug?: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      toggleWishlist: (item) => {
        const state = get();
        const exists = state.items.find(i => i.id === item.id);
        if (exists) {
          pushRemoveFromWishlist(exists);
          set({ items: state.items.filter(i => i.id !== item.id) });
        } else {
          pushAddToWishlist(item);
          set({ items: [...state.items, item] });
        }
      },
      
      removeFromWishlist: (itemId) => {
        const state = get();
        const item = state.items.find(i => i.id === itemId);
        if (item) pushRemoveFromWishlist(item);
        set({ items: state.items.filter(i => i.id !== itemId) });
      },
      
      isInWishlist: (itemId) => {
        return get().items.some(i => i.id === itemId);
      },

      clearWishlist: () => set({ items: [] })
    }),
    {
      name: 'store-wishlist-storage',
    }
  )
);
