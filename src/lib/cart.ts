// src/lib/cart.ts
"use client"

export * from "./cart-store"
import { useCartStore, useCart, cartCount, cartSubtotal, getCart, saveCart } from "./cart-store"

export { useCartStore, useCart, cartCount, cartSubtotal, getCart, saveCart }
export default useCartStore
