// src/components/CartSync.tsx
"use client"

import { useEffect, useRef } from "react"
import { useCart, type CartLine } from "@/lib/cart-store"
import { syncCart, loadCart } from "@/app/actions/cart"
import { supabaseBrowser } from "@/lib/supabase/client"

export default function CartSync({ loggedIn }: { loggedIn?: boolean }) {
  const cart = useCart()
  const items: CartLine[] = Array.isArray(cart) ? cart[0] : cart?.items || []
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (!loggedIn || initialLoadDone.current) return

    async function sync() {
      try {
        const serverCart = await loadCart()
        if (serverCart && Array.isArray(serverCart) && serverCart.length > 0) {
          // دمج عناصر السلة
        }
      } catch (err) {
        console.error("CartSync error:", err)
      } finally {
        initialLoadDone.current = true
      }
    }

    sync()
  }, [loggedIn])

  return null
}
