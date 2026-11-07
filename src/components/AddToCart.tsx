// src/components/AddToCart.tsx
"use client"

import React, { useState } from "react"
import { useCart } from "@/lib/cart"

interface AddToCartProps {
  product_id: string
  slug: string
  title: string
  image?: string | null
  price: number
  stock: number
  volume?: string
  className?: string
  [key: string]: any
}

export default function AddToCart({
  product_id,
  slug,
  title,
  image,
  price,
  stock,
  volume = "50ml",
  className = "",
}: AddToCartProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (stock <= 0) return

    // إعداد كائن المنتج للسلة شاملاً السعة والسعر المحدد
    addItem({
      id: `${product_id}-${volume}`,
      product_id,
      title_en: title,
      title_ar: title,
      volume,
      price,
      qty: 1,
      image: image || undefined,
    })

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
            ? "bg-emerald-600 text-white"
            : "bg-gold text-ink hover:bg-gold-light shadow-md hover:shadow-gold/20"
        }`
      }
    >
      {stock <= 0 ? "Out of Stock / غير متوفر" : added ? "✓ Added to Bag" : `Add to Bag (${volume})`}
    </button>
  )
}
