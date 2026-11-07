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
  quantity?: number
  image?: string
  [key: string]: any
}

// تصدير CartLine كمرادف لـ CartItem لتوافق جميع المكونات
export type CartLine = CartItem;

interface CartState {
  items: CartItem[]
  addItem: (item: any) => void
  addToCart: (item: any) => void
  removeItem: (id: string) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  [key: string]: any
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: any) => {
        const current = get().items || []
        const itemId = item.id || `${item.product_id}-${item.volume || "50ml"}`
        const existingIndex = current.findIndex((i) => i.id === itemId)

        let updated = [...current]
        const addQty = item.qty || item.quantity || 1
        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: (updated[existingIndex].qty || 1) + addQty,
            quantity: (updated[existingIndex].qty || 1) + addQty,
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
            qty: addQty,
            quantity: addQty,
            image: item.image || undefined,
          })
        }
        set({ items: updated })
      },
      addToCart: (item: any) => get().addItem(item),
      removeItem: (id: string) => {
        set({ items: (get().items || []).filter((i) => i.id !== id) })
      },
      removeFromCart: (id: string) => get().removeItem(id),
      updateQty: (id: string, qty: number) => {
        const q = Math.max(1, qty)
        set({
          items: (get().items || []).map((i) =>
            i.id === id ? { ...i, qty: q, quantity: q } : i
          ),
        })
      },
      updateQuantity: (id: string, qty: number) => get().updateQty(id, qty),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "aura_cart_store_v2",
    }
  )
)

export function cartCount(input?: any): number {
  if (!input) return 0
  const items = Array.isArray(input) ? input : Array.isArray(input?.items) ? input.items : []
  return items.reduce((sum: number, item: any) => sum + (Number(item?.qty || item?.quantity) || 1), 0)
}

export function cartSubtotal(input?: any): number {
  if (!input) return 0
  const items = Array.isArray(input) ? input : Array.isArray(input?.items) ? input.items : []
  return items.reduce((sum: number, item: any) => {
    const p = item?.discount_price && Number(item.discount_price) > 0 ? Number(item.discount_price) : Number(item?.price || 0)
    const q = Number(item?.qty || item?.quantity) || 1
    return sum + p * q
  }, 0)
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("aura_cart_store_v2")
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed?.state?.items || []
  } catch (e) {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  useCartStore.setState({ items })
}

export function useCart(): any {
  const store = useCartStore()
  const count = cartCount(store.items)
  const subtotal = cartSubtotal(store.items)

  const res: any = [store.items || [], store]
  res.items = store.items || []
  res.addItem = store.addItem
  res.addToCart = store.addToCart
  res.removeItem = store.removeItem
  res.removeFromCart = store.removeFromCart
  res.updateQty = store.updateQty
  res.updateQuantity = store.updateQuantity
  res.clearCart = store.clearCart
  res.count = count
  res.subtotal = subtotal

  return res
}

export default useCartStore
