// src/components/CartDrawer.tsx
"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toStorageUrl, DEFAULT_PLACEHOLDER } from "@/lib/image-utils"
import { useLocale, useTranslations } from "next-intl"
import { useCart, useCartStore, cartSubtotal, CartItem } from "@/lib/cart-store"
import { money } from "@/lib/format"

export default function CartDrawer({ loggedIn }: { loggedIn?: boolean }) {
  const locale = useLocale()
  const t = useTranslations("cart")
  const c = useTranslations("common")
  const [mounted, setMounted] = useState(false)

  const cart = useCart()
  // The header's bag button opens the drawer through the shared store (isOpen/setOpen).
  const isOpen: boolean = !!cart?.isOpen
  const setIsOpen = (open: boolean) => useCartStore.getState().setOpen(open)
  const items: CartItem[] = Array.isArray(cart) ? cart[0] : cart?.items || []
  const removeItem = cart?.removeItem || cart?.removeFromCart || (() => {})
  const updateQty = cart?.updateQty || cart?.updateQuantity || (() => {})

  useEffect(() => {
    setMounted(true)

    const handleOpen = () => useCartStore.getState().setOpen(true)
    window.addEventListener("aura_open_cart", handleOpen)
    return () => window.removeEventListener("aura_open_cart", handleOpen)
  }, [])

  if (!mounted) return null

  const subtotal = cartSubtotal(items)

  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-50 w-full max-w-md bg-surface border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-serif text-gold uppercase tracking-wider">{t("title")}</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-cream/60 hover:text-cream p-2 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body / Items List */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {items.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-cream/60 text-sm">{t("empty")}</p>
            </div>
          )}

          {items.map((l: CartItem) => {
            const price = l.discount_price && Number(l.discount_price) > 0 ? Number(l.discount_price) : Number(l.price || 0)
            const qty = Number(l.qty || l.quantity || 1)

            return (
              <div key={l.id || `${l.product_id}-${l.volume}`} className="flex gap-4 border-b border-white/5 pb-4">
                <div className="relative h-24 w-20 shrink-0 bg-ink border border-white/10 overflow-hidden rounded-sm">
                  {(l.image || l.image_url) ? (
                    <Image src={toStorageUrl(l.image || l.image_url) || DEFAULT_PLACEHOLDER} alt={l.title_en || l.name || "Product"} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-cream/40">AURA</div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-serif text-cream text-sm">{locale === "ar" ? (l.title_ar || l.title_en || l.name || l.title) : (l.title_en || l.title_ar || l.name || l.title)}</h3>
                  <p className="text-[10px] uppercase tracking-wider text-gold mt-0.5">{l.volume}</p>
                  <p className="text-xs font-bold text-gold mt-1">{money(price, locale)} {c("currency")}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-white/10 bg-ink">
                      <button
                        type="button"
                        onClick={() => updateQty(l.id, Math.max(1, qty - 1))}
                        className="px-2 py-0.5 text-xs hover:text-gold text-cream/70"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-mono">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(l.id, qty + 1)}
                        className="px-2 py-0.5 text-xs hover:text-gold text-cream/70"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(l.id)}
                      className="text-[11px] text-red-400 hover:text-red-300"
                    >
                      {c("delete") || "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-white/10 bg-ink/50 space-y-4">
            <div className="flex justify-between items-center text-sm font-serif">
              <span className="text-cream/70">{t("subtotal")}</span>
              <span className="font-bold text-gold text-lg">{money(subtotal, locale)} {c("currency")}</span>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="w-full btn-gold py-3 text-center uppercase tracking-widest text-xs font-bold block"
            >
              {t("checkout")}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
