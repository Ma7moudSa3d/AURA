// src/app/cart/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { useCart, cartSubtotal, CartItem } from "@/lib/cart-store"
import { money } from "@/lib/format"

export default function CartPage() {
  const locale = useLocale()
  const t = useTranslations("cart")
  const c = useTranslations("common")
  const [mounted, setMounted] = useState(false)

  const cart = useCart()
  const items: CartItem[] = Array.isArray(cart) ? cart[0] : (cart?.items || [])
  const removeItem = cart?.removeItem || cart?.removeFromCart || (() => {})
  const updateQty = cart?.updateQty || cart?.updateQuantity || (() => {})

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="container-x py-16 text-center text-cream/60">
        Loading cart...
      </div>
    )
  }

  const subtotal = cartSubtotal(items)

  return (
    <div className="container-x py-12">
      <h1 className="h-display text-4xl mb-8">{t("title")}</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-white/5 bg-surface">
          <p className="text-lg text-cream/70 mb-6">{t("empty")}</p>
          <Link href="/shop" className="btn-gold px-8 py-3 uppercase tracking-widest text-xs font-bold inline-block">
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="divide-y divide-white/5 border border-white/5 bg-surface">
              {items.map((l: CartItem) => {
                const price = l.discount_price && Number(l.discount_price) > 0 ? Number(l.discount_price) : Number(l.price || 0)
                const qty = Number(l.qty || l.quantity || 1)

                return (
                  <div key={l.id || `${l.product_id}-${l.volume}`} className="flex gap-4 p-4 items-center">
                    <div className="relative h-24 w-20 shrink-0 bg-ink border border-white/10 overflow-hidden">
                      {l.image ? (
                        <Image src={l.image} alt={l.title_en || "Product"} fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-cream/40">AURA</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-serif text-cream text-lg">{locale === "ar" ? (l.title_ar || l.title_en) : (l.title_en || l.title_ar)}</h3>
                      <p className="text-xs uppercase tracking-wider text-gold mt-0.5">{l.volume}</p>
                      <p className="text-sm font-bold text-gold mt-1">{money(price, locale)} {c("currency")}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-white/10 bg-ink">
                        <button
                          type="button"
                          onClick={() => updateQty(l.id, Math.max(1, qty - 1))}
                          className="px-2.5 py-1 text-xs hover:text-gold text-cream/70"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-mono">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(l.id, qty + 1)}
                          className="px-2.5 py-1 text-xs hover:text-gold text-cream/70"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(l.id)}
                        className="text-xs text-red-400 hover:text-red-300 p-2"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border border-white/10 bg-surface p-6 h-fit space-y-6">
            <h2 className="text-lg font-serif text-gold uppercase tracking-wider border-b border-white/10 pb-4">
              {t("summary")}
            </h2>

            <div className="flex justify-between text-sm">
              <span className="text-cream/70">{t("subtotal")}</span>
              <span className="font-bold text-gold">{money(subtotal, locale)} {c("currency")}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full btn-gold py-3 text-center uppercase tracking-widest text-xs font-bold block"
            >
              {t("checkout")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
