// src/components/ProductPurchaseSection.tsx
"use client"

import React, { useState } from "react"
import AddToCart from "@/components/AddToCart"
import WhatsAppButton from "@/components/WhatsAppButton"

export default function ProductPurchaseSection({
  product,
  locale,
  currency,
  image,
  whatsappNumber,
  waMsg,
  waLabel,
}: any) {
  let rawVariants: any[] = []
  if (Array.isArray(product?.variants)) {
    rawVariants = product.variants
  } else if (typeof product?.variants === "string") {
    try {
      rawVariants = JSON.parse(product.variants)
    } catch (e) {
      rawVariants = []
    }
  }

  const variants: any[] =
    rawVariants.length > 0
      ? rawVariants
      : [
          {
            volume: product?.volume || "50ml",
            price: Number(product?.price) || 0,
            discount_price: product?.discount_price ? Number(product.discount_price) : null,
            stock_qty: product?.stock_qty || 10,
          },
        ]

  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedVariant = variants[selectedIndex] || variants[0]

  const originalPrice = Number(selectedVariant?.price || 0)
  const discountPrice = selectedVariant?.discount_price ? Number(selectedVariant.discount_price) : null
  const currentPrice = discountPrice && discountPrice > 0 ? discountPrice : originalPrice
  const hasDiscount = discountPrice !== null && discountPrice > 0 && discountPrice < originalPrice
  const currentStock = selectedVariant?.stock_qty ?? product?.stock_qty ?? 10

  return (
    <div className="mt-5 space-y-6">
      {/* Dynamic Price */}
      <div>
        <p className="text-3xl font-serif">
          <span className="text-gold font-bold">{currentPrice} {currency}</span>
          {hasDiscount && (
            <span className="ms-3 text-lg text-cream/40 line-through">
              {originalPrice} {currency}
            </span>
          )}
        </p>
        {currentStock > 0 && currentStock <= (product?.low_stock_threshold || 5) && (
          <p className="mt-2 text-sm text-gold/80 font-mono">
            {locale === "ar" ? `متبقي ${currentStock} قطع فقط!` : `Only ${currentStock} left in stock!`}
          </p>
        )}
      </div>

      {/* Size Buttons */}
      {variants.length > 0 && (
        <div className="space-y-3 pt-2">
          <label className="block text-xs uppercase tracking-widest text-gold font-bold">
            {locale === "ar" ? "اختر السعة / Size:" : "Select Size / السعة:"}
          </label>
          <div className="flex flex-wrap gap-3">
            {variants.map((v: any, idx: number) => {
              const isSelected = idx === selectedIndex
              const vPrice = v.discount_price && Number(v.discount_price) > 0 ? Number(v.discount_price) : Number(v.price)

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-5 py-2.5 text-xs font-sans uppercase tracking-wider transition-all duration-200 border flex flex-col items-center justify-center min-w-[100px] cursor-pointer ${
                    isSelected
                      ? "border-gold bg-gold/15 text-gold font-bold shadow-lg shadow-gold/10 scale-105"
                      : "border-white/10 bg-surface/80 text-cream/70 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <span className="font-bold text-sm">{v.volume}</span>
                  <span className="text-[11px] opacity-80 mt-0.5">{vPrice} {currency}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {product?.description_en && (
        <p className="leading-relaxed text-cream/75 pt-2">
          {locale === "ar" ? (product.description_ar || product.description_en) : product.description_en}
        </p>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <AddToCart
          product_id={product?.id}
          slug={product?.slug}
          title={locale === "ar" ? (product?.title_ar || product?.title_en) : product?.title_en}
          image={image}
          price={currentPrice}
          stock={currentStock}
          volume={selectedVariant?.volume}
        />

        <WhatsAppButton
          number={whatsappNumber}
          message={waMsg}
          label={waLabel}
          className="btn-ghost w-full"
        />
      </div>
    </div>
  )
}
