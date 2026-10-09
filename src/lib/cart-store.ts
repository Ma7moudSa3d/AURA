"use client";
// Zustand chosen over React Query: server data is fetched in Server Components, so the only client state
// is the cart + drawer UI. Zustand's persist middleware gives guest carts (localStorage) with ~1KB of code.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = { product_id: string; slug: string; title: string; image: string | null; price: number; qty: number; stock: number };

type S = {
  lines: CartLine[]; open: boolean;
  add: (l: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void; setOpen: (o: boolean) => void;
  replace: (lines: CartLine[]) => void;
};

export const useCart = create<S>()(persist((set) => ({
  lines: [], open: false,
  add: (l, qty = 1) => set((s) => {
    const ex = s.lines.find((x) => x.product_id === l.product_id);
    const lines = ex
      ? s.lines.map((x) => (x.product_id === l.product_id ? { ...x, ...l, qty: Math.min(Math.min(20, l.stock), x.qty + qty) } : x))
      : [...s.lines, { ...l, qty: Math.min(Math.min(20, l.stock), qty) }];
    return { lines, open: true };
  }),
  setQty: (id, qty) => set((s) => ({ lines: s.lines.map((x) => (x.product_id === id ? { ...x, qty: Math.max(1, Math.min(20, x.stock, qty)) } : x)) })),
  remove: (id) => set((s) => ({ lines: s.lines.filter((x) => x.product_id !== id) })),
  clear: () => set({ lines: [] }),
  setOpen: (open) => set({ open }),
  replace: (lines) => set({ lines }),
}), { name: "aura-cart", partialize: (s) => ({ lines: s.lines }) }));

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.price, 0);
