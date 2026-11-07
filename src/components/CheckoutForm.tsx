// src/components/CheckoutForm.tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useCart, cartSubtotal, CartItem } from "@/lib/cart-store"
import { createOrder } from "@/app/actions/order"
import { money } from "@/lib/format"

interface CheckoutFormProps {
  enable_cod?: boolean
  enable_instapay?: boolean
  enable_deposit?: boolean
  shipping_fee?: number
  free_shipping_threshold?: number
}

export default function CheckoutForm({
  enable_cod = true,
  enable_instapay = true,
  enable_deposit = true,
  shipping_fee = 60,
  free_shipping_threshold = 2000,
}: CheckoutFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("checkout")
  const c = useTranslations("common")

  const cart = useCart()
  const lines: CartItem[] = Array.isArray(cart) ? cart[0] : cart?.items || []
  const clearCart = cart?.clearCart || (() => {})

  const subtotal = cartSubtotal(lines)
  const isFreeShipping = subtotal >= free_shipping_threshold
  const actualShippingFee = isFreeShipping ? 0 : shipping_fee

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "INSTAPAY" | "DEPOSIT">(
    enable_cod ? "COD" : enable_instapay ? "INSTAPAY" : "DEPOSIT"
  )

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)

  // حساب المبالغ الإجمالية والدفع الجزئي (العربون 25%)
  const discountAmount = appliedCoupon?.discount || 0
  const totalAmount = Math.max(0, subtotal - discountAmount + actualShippingFee)
  const depositAmount = paymentMethod === "DEPOSIT" ? Math.round(totalAmount * 0.25) : totalAmount
  const remainingBalance = paymentMethod === "DEPOSIT" ? totalAmount - depositAmount : 0

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError(null)
    if (!couponCode.trim()) return

    if (couponCode.trim().toUpperCase() === "AURAFIRST") {
      const discount = Math.round(subtotal * 0.1)
      setAppliedCoupon({ code: "AURAFIRST", discount })
    } else {
      setCouponError(locale === "ar" ? "كود الخصم غير صالح" : "Invalid coupon code")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formEl = e.currentTarget
      const fd = new FormData(formEl)

      // تجهيز عناصر السلة بصيغة JSON آمنة وبأنواع صريحة
      const preparedItems = lines.map((l: CartItem) => ({
        product_id: l.product_id,
        volume: l.volume || "50ml",
        price: l.discount_price && Number(l.discount_price) > 0 ? Number(l.discount_price) : Number(l.price || 0),
        qty: Number(l.qty || l.quantity || 1),
      }))

      fd.set("items", JSON.stringify(preparedItems))
      fd.set("payment_method", paymentMethod)
      fd.set("subtotal", String(subtotal))
      fd.set("shipping_fee", String(actualShippingFee))
      fd.set("total_amount", String(totalAmount))
      fd.set("deposit_amount", String(depositAmount))
      fd.set("remaining_balance", String(remainingBalance))

      if (appliedCoupon) {
        fd.set("coupon_code", appliedCoupon.code)
        fd.set("discount_amount", String(appliedCoupon.discount))
      }

      if (proofFile && paymentMethod !== "COD") {
        fd.set("proof", proofFile)
      }

      const res = await createOrder(fd)

      if (!res?.ok) {
        setError(res?.error || (locale === "ar" ? "فشل إنشاء الطلب" : "Failed to place order"))
        setLoading(false)
        return
      }

      clearCart()
      router.push(`/checkout/success?order_id=${res.order_id || ""}`)
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center border border-white/5 bg-surface">
        <p className="text-cream/60 mb-4">{locale === "ar" ? "سلتك فارغة" : "Your cart is empty"}</p>
        <button onClick={() => router.push("/shop")} className="btn-gold px-6 py-2.5 text-xs font-bold uppercase tracking-widest">
          {locale === "ar" ? "تسوق الآن" : "Go to Shop"}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* قسم بيانات الشحن والدفع */}
      <div className="lg:col-span-7 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded">
            {error}
          </div>
        )}

        {/* بيانات العميل والشحن */}
        <div className="border border-white/10 bg-surface p-6 space-y-4">
          <h2 className="text-gold font-serif text-lg uppercase tracking-wider border-b border-white/10 pb-3">
            {locale === "ar" ? "بيانات الشحن" : "Shipping Information"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gold mb-1">
                {locale === "ar" ? "الاسم بالكامل *" : "Full Name *"}
              </label>
              <input
                type="text"
                name="customer_name"
                required
                className="w-full bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gold mb-1">
                {locale === "ar" ? "رقم الهاتف *" : "Phone Number *"}
              </label>
              <input
                type="tel"
                name="contact_phone"
                required
                className="w-full bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gold mb-1">
              {locale === "ar" ? "البريد الإلكتروني *" : "Email Address *"}
            </label>
            <input
              type="email"
              name="contact_email"
              required
              className="w-full bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gold mb-1">
                {locale === "ar" ? "المحافظة *" : "Governorate *"}
              </label>
              <input
                type="text"
                name="governorate"
                required
                className="w-full bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gold mb-1">
                {locale === "ar" ? "المدينة / المنطقة *" : "City / District *"}
              </label>
              <input
                type="text"
                name="city"
                required
                className="w-full bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gold mb-1">
              {locale === "ar" ? "تفاصيل العنوان (الشارع / العمارة) *" : "Detailed Address *"}
            </label>
            <textarea
              name="address_details"
              rows={2}
              required
              className="w-full bg-ink border border-white/10 p-3 text-xs text-white focus:border-gold outline-none"
            />
          </div>
        </div>

        {/* اختيار طريقة الدفع */}
        <div className="border border-white/10 bg-surface p-6 space-y-4">
          <h2 className="text-gold font-serif text-lg uppercase tracking-wider border-b border-white/10 pb-3">
            {locale === "ar" ? "طريقة الدفع" : "Payment Method"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {enable_cod && (
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  paymentMethod === "COD"
                    ? "border-gold bg-gold/15 text-gold font-bold"
                    : "border-white/10 bg-ink text-cream/70 hover:border-white/30"
                }`}
              >
                <span className="text-xs font-bold uppercase">{locale === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}</span>
                <span className="text-[10px] opacity-75 mt-1">{locale === "ar" ? "(COD)" : "(Full COD)"}</span>
              </button>
            )}

            {enable_instapay && (
              <button
                type="button"
                onClick={() => setPaymentMethod("INSTAPAY")}
                className={`p-4 border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  paymentMethod === "INSTAPAY"
                    ? "border-gold bg-gold/15 text-gold font-bold"
                    : "border-white/10 bg-ink text-cream/70 hover:border-white/30"
                }`}
              >
                <span className="text-xs font-bold uppercase">{locale === "ar" ? "إنستا باي (كامل)" : "InstaPay (Full)"}</span>
                <span className="text-[10px] opacity-75 mt-1">100% Online</span>
              </button>
            )}

            {enable_deposit && (
              <button
                type="button"
                onClick={() => setPaymentMethod("DEPOSIT")}
                className={`p-4 border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  paymentMethod === "DEPOSIT"
                    ? "border-gold bg-gold/15 text-gold font-bold"
                    : "border-white/10 bg-ink text-cream/70 hover:border-white/30"
                }`}
              >
                <span className="text-xs font-bold uppercase">{locale === "ar" ? "عربون 25%" : "25% Deposit"}</span>
                <span className="text-[10px] opacity-75 mt-1">{locale === "ar" ? "والباقي عند الاستلام" : "+ Rest COD"}</span>
              </button>
            )}
          </div>

          {/* رفع إثبات الدفع إن لم يكن COD */}
          {paymentMethod !== "COD" && (
            <div className="pt-4 border-t border-white/10 space-y-3 bg-ink/40 p-4 border rounded">
              <p className="text-xs text-gold font-bold">
                {locale === "ar"
                  ? "تحويل إنستا باي إلى الحساب المعتمد ورفع إثبات التحويل:"
                  : "Please transfer via InstaPay & upload receipt proof:"}
              </p>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cream/80 mb-1">
                  {locale === "ar" ? "رقم المرجع / العملية *" : "Transaction Ref ID *"}
                </label>
                <input
                  type="text"
                  name="transaction_reference_id"
                  required={paymentMethod !== "COD"}
                  placeholder="e.g. 1234567890"
                  className="w-full bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cream/80 mb-1">
                  {locale === "ar" ? "صورة إيصال التحويل (اختياري)" : "Payment Receipt Image"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full bg-ink border border-white/10 p-2 text-xs text-cream/70"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ملخص الطلب والتوتال */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border border-white/10 bg-surface p-6 space-y-6 sticky top-24">
          <h2 className="text-gold font-serif text-lg uppercase tracking-wider border-b border-white/10 pb-3">
            {locale === "ar" ? "ملخص الطلب" : "Order Summary"}
          </h2>

          <div className="divide-y divide-white/5 space-y-3 max-h-60 overflow-y-auto pr-1">
            {lines.map((l: CartItem) => {
              const price = l.discount_price && Number(l.discount_price) > 0 ? Number(l.discount_price) : Number(l.price || 0)
              const qty = Number(l.qty || l.quantity || 1)

              return (
                <div key={l.id || `${l.product_id}-${l.volume}`} className="flex justify-between items-center text-xs pt-3">
                  <div>
                    <p className="font-serif text-cream font-bold">{locale === "ar" ? (l.title_ar || l.title_en) : l.title_en}</p>
                    <p className="text-[10px] text-gold uppercase">{l.volume} × {qty}</p>
                  </div>
                  <span className="font-mono text-gold">{money(price * qty, locale)} {c("currency")}</span>
                </div>
              )
            })}
          </div>

          {/* تطبيق الخصم */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={locale === "ar" ? "كود الخصم" : "Coupon code"}
                className="flex-1 bg-ink border border-white/10 px-3 py-2 text-xs text-white focus:border-gold outline-none uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="btn-gold px-4 text-xs font-bold uppercase tracking-wider"
              >
                {locale === "ar" ? "تطبيق" : "Apply"}
              </button>
            </div>
            {couponError && <p className="text-[11px] text-red-400 mt-1">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[11px] text-emerald-400 mt-1">
                ✓ {appliedCoupon.code} applied (-{appliedCoupon.discount} EGP)
              </p>
            )}
          </div>

          {/* الحسابات النهائية */}
          <div className="space-y-2 border-t border-white/10 pt-4 text-xs">
            <div className="flex justify-between text-cream/70">
              <span>{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{money(subtotal, locale)} {c("currency")}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-400">
                <span>{locale === "ar" ? "الخصم" : "Discount"}</span>
                <span>-{money(appliedCoupon.discount, locale)} {c("currency")}</span>
              </div>
            )}

            <div className="flex justify-between text-cream/70">
              <span>{locale === "ar" ? "الشحن" : "Shipping"}</span>
              <span>{actualShippingFee === 0 ? (locale === "ar" ? "مجاني" : "FREE") : `${actualShippingFee} ${c("currency")}`}</span>
            </div>

            <div className="flex justify-between font-serif text-base text-gold font-bold border-t border-white/10 pt-3">
              <span>{locale === "ar" ? "الإجمالي" : "Total Amount"}</span>
              <span>{money(totalAmount, locale)} {c("currency")}</span>
            </div>

            {paymentMethod === "DEPOSIT" && (
              <div className="bg-gold/10 border border-gold/20 p-3 rounded mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-gold">
                  <span>{locale === "ar" ? "المطلوب سداده الآن (25% عربون):" : "Pay Now (25% Deposit):"}</span>
                  <span>{money(depositAmount, locale)} {c("currency")}</span>
                </div>
                <div className="flex justify-between text-cream/70">
                  <span>{locale === "ar" ? "المتبقي عند الاستلام:" : "Remaining on Delivery:"}</span>
                  <span>{money(remainingBalance, locale)} {c("currency")}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3.5 uppercase tracking-widest text-xs font-bold transition disabled:opacity-50"
          >
            {loading ? (locale === "ar" ? "جاري تسجيل الطلب..." : "Processing Order...") : (locale === "ar" ? "إتمام الطلب الآن" : "PLACE ORDER NOW")}
          </button>
        </div>
      </div>
    </form>
  )
}
