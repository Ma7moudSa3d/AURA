// src/components/AddToCart.tsx
"use client"

import React, { useState } from "react"
import { useCart } from "@/lib/cart"

export default function AddToCart({
  product_id,
  slug,
  title,
  image,
  price,
  stock,
  volume = "50ml",
  className = "",
}: any) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (stock <= 0) return

    try {
      addItem({
        id: `${product_id}-${volume}`,
        product_id,
        slug,
        title_en: title,
        title_ar: title,
        title,
        volume,
        price,
        qty: 1,
        image: image || undefined,
      })
    } catch (err) {
      console.error("Cart error:", err)
    }

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={stock <= 0}
      className={
        className ||
        `w-full py-3.5 px-6 font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer ${
          stock <= 0
            ? "bg-white/10 text-cream/40 cursor-not-allowed"
            : added
            ? "bg-gold2 text-ink"
            : "bg-gold text-ink hover:brightness-110 shadow-md hover:shadow-glow"
        }`
      }
    >
      {stock <= 0 ? "Out of Stock / غير متوفر" : added ? "✓ Added to Bag" : `Add to Bag (${volume})`}
    </button>
  )
}
