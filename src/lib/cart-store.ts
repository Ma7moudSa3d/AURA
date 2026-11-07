import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  product_id: string;
  volume?: string;
  quantity: number;
  qty?: number;
  price?: number;
  product?: any;
  [key: string]: any;
}

export type CartLine = CartItem;

export interface CartStoreState {
  items: CartItem[];
  lines: CartItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggleCart: () => void;
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  [key: string]: any;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      lines: [],
      isOpen: false,
      setOpen: (open: boolean) => set({ isOpen: open }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (newItem: any) => {
        const currentItems = get().items || get().lines || [];
        const itemId = newItem.id || `${newItem.product_id}-${newItem.volume || "default"}`;
        const existingIndex = currentItems.findIndex((i) => i.id === itemId);

        let updatedItems: CartItem[];
        if (existingIndex > -1) {
          updatedItems = [...currentItems];
          const existing = updatedItems[existingIndex];
          const currentQty = existing.quantity ?? existing.qty ?? 1;
          const addQty = newItem.quantity ?? newItem.qty ?? 1;
          const newQty = currentQty + addQty;
          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQty,
            qty: newQty,
          };
        } else {
          const qty = newItem.quantity ?? newItem.qty ?? 1;
          const itemToAdd = {
            ...newItem,
            id: itemId,
            quantity: qty,
            qty: qty,
          };
          updatedItems = [...currentItems, itemToAdd];
        }

        set({ items: updatedItems, lines: updatedItems });
      },
      removeItem: (id: string) => {
        const currentItems = get().items || get().lines || [];
        const updated = currentItems.filter((i) => i.id !== id);
        set({ items: updated, lines: updated });
      },
      updateQuantity: (id: string, quantity: number) => {
        const currentItems = get().items || get().lines || [];
        if (quantity <= 0) {
          const updated = currentItems.filter((i) => i.id !== id);
          set({ items: updated, lines: updated });
        } else {
          const updated = currentItems.map((i) =>
            i.id === id ? { ...i, quantity, qty: quantity } : i
          );
          set({ items: updated, lines: updated });
        }
      },
      clearCart: () => set({ items: [], lines: [] }),
    }),
    {
      name: "aura-cart-storage",
      partialize: (state) => ({ items: state.items, lines: state.items }),
    }
  )
);

// useCart flexible export allowing selector functions e.g. useCart((s) => s.lines)
export const useCart: any = useCartStore;

export const cartCount = (items?: CartItem[]) => {
  if (!items) return 0;
  return items.reduce((acc, item) => acc + (item.quantity ?? item.qty ?? 1), 0);
};

export const cartSubtotal = (items?: CartItem[]) => {
  if (!items) return 0;
  return items.reduce((acc, item) => {
    const price = item.price ?? item.product?.price ?? 0;
    const qty = item.quantity ?? item.qty ?? 1;
    return acc + price * qty;
  }, 0);
};

export const getCart = () => useCartStore.getState();
export const saveCart = () => {};
