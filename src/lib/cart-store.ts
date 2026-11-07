// src/lib/cart-store.ts
"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  product_id: string
  title_en: string
  title_ar: string
  title?: string
  volume: string
  price: number
  discount_price?: number | null
  qty: number
  image?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: any) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: any) => {
        const current = get().items || []
        // معرّف فريد يجمع بين معرّف المنتج والسعة المختارة
        const itemId = item.id || `${item.product_id}-${item.volume || "50ml"}`
        const existingIndex = current.findIndex((i) => i.id === itemId)

        let updated = [...current]
        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: (updated[existingIndex].qty || 1) + (item.qty || 1),
            price: Number(item.price) || updated[existingIndex].price,
          }
        } else {
          updated.push({
            id: itemId,
            product_id: item.product_id,
            title_en: item.title_en || item.title || "AURA Perfume",
            title_ar: item.title_ar || item.title || "عطر أورا",
            title: item.title || item.title_en || "AURA Perfume",
            volume: item.volume || "50ml",
            price: Number(item.price) || 0,
            discount_price: item.discount_price ? Number(item.discount_price) : null,
            qty: item.qty || 1,
            image: item.image || undefined,
          })
        }
        set({ items: updated })
      },
      removeItem: (id: string) => {
        set({ items: (get().items || []).filter((i) => i.id !== id) })
      },
      updateQty: (id: string, qty: number) => {
        set({
          items: (get().items || []).map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, qty) } : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "aura_cart_store_v2",
    }
  )
)
