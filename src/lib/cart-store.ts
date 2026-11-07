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
        const currentItems = get().items || [];
        const itemId = newItem.id || `${newItem.product_id}-${newItem.volume || "default"}`;
        const existingIndex = currentItems.findIndex((i) => i.id === itemId);

        let updatedItems: CartItem[];
        if (existingIndex > -1) {
          updatedItems = [...currentItems];
          const existing = updatedItems[existingIndex];
          const currentQty = existing.quantity ?? existing.qty ?? 1;
          const addQty = newItem.quantity ?? newItem.qty ?? 1;
          const newQty = currentQty + addQty;
          updatedItems[existingIndex] = { ...existing, quantity: newQty, qty: newQty };
        } else {
          const qty = newItem.quantity ?? newItem.qty ?? 1;
          updatedItems = [...currentItems, { ...newItem, id: itemId, quantity: qty, qty: qty }];
        }
        set({ items: updatedItems, lines: updatedItems });
      },
      removeItem: (id: string) => {
        const updated = (get().items || []).filter((i) => i.id !== id);
        set({ items: updated, lines: updated });
      },
      updateQuantity: (id: string, quantity: number) => {
        const currentItems = get().items || [];
        const updated = quantity <= 0 
          ? currentItems.filter((i) => i.id !== id)
          : currentItems.map((i) => i.id === id ? { ...i, quantity, qty: quantity } : i);
        set({ items: updated, lines: updated });
      },
      clearCart: () => set({ items: [], lines: [] }),
    }),
    { name: "aura-cart-storage" }
  )
);

// تصدير useCart ليعمل كـ Hook مباشر
export const useCart = useCartStore;
