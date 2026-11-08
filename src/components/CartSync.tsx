"use client"

import { useEffect, useMemo } from "react"
import { useCart, type CartLine } from "@/lib/cart-store"
import { syncCart } from "@/app/actions/cart"

/**
 * Mirrors the signed-in customer's cart to the database (product + quantity only) so that
 * abandoned-cart reminder emails know what was left behind. Guests stay in localStorage.
 */
export default function CartSync({ loggedIn }: { loggedIn?: boolean }) {
  const cart = useCart()
  const items: CartLine[] = Array.isArray(cart) ? cart[0] : cart?.items || []

  // one row per product (cart_items is unique on cart_id + product_id), quantities summed
  const payload = useMemo(() => {
    const byProduct = new Map<string, number>()
    for (const i of items) {
      if (!i.product_id) continue
      byProduct.set(i.product_id, (byProduct.get(i.product_id) ?? 0) + Number(i.quantity ?? i.qty ?? 1))
    }
    return Array.from(byProduct, ([product_id, qty]) => ({ product_id, qty: Math.min(20, Math.max(1, qty)) }))
  }, [items])

  const key = JSON.stringify(payload)

  useEffect(() => {
    if (!loggedIn) return
    const t = setTimeout(() => {
      syncCart(payload).catch((err) => console.error("CartSync error:", err))
    }, 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, key])

  return null
}
