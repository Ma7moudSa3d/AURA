// src/lib/cart.ts
"use client"

// إعادة تصدير كل الوظائف من cart-store لضمان العمل مع أي مكون
export * from "./cart-store"

import { useCartStore } from "./cart-store"

// توفير هوك useCart كمرادف لـ useCartStore
export function useCart() {
  const store = useCartStore() as any
  return {
    items: store.items || [],
    addItem: store.addItem || store.addToCart || (() => {}),
    removeItem: store.removeItem || store.removeFromCart || (() => {}),
    updateQty: store.updateQty || store.updateQuantity || (() => {}),
    clearCart: store.clearCart || (() => {}),
    ...store,
  }
}
