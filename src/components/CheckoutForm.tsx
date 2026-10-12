"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { createOrder, validateCouponAction } from "@/app/actions/order";
import { money } from "@/lib/format";

const schema = z.object({
  customer_name: z.string().trim().min(2),
  customer_phone: z.string().trim().regex(/^[+0-9\s-]{8,20}$/),
  address_line1: z.string().trim().min(3),
  address_line2: z.string().optional(),
  city: z.string().trim().min(2),
  notes: z.string().max(500).optional(),
  transaction_reference_id: z.string().max(80).optional(),
  coupon: z.string().max(40).optional(),
});

type V = z.infer<typeof schema>;

type AppliedCoupon = {
  code: string;
  discount: number;
  freeShipping: boolean;
};

export default function CheckoutForm({
  defaults,
  shippingFee,
  freeThreshold,
  payNumber,
  enableCOD = true,
  enableInstapay = true,
  enableDeposit = true,
}: {
  defaults: { name: string; phone: string };
  shippingFee: number;
  freeThreshold: number;
  payNumber: string;
  enableCOD?: boolean;
  enableInstapay?: boolean;
  enableDeposit?: boolean;
}) {
  const t = useTranslations("checkout");
  const c = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const { lines, clear } = useCart();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Default payment method selection
  const [paymentMethod, setPaymentMethod] = useState<"INSTAPAY" | "DEPOSIT" | "COD">(
    enableInstapay ? "INSTAPAY" : enableDeposit ? "DEPOSIT" : "COD"
  );

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: defaults.name,
      customer_phone: defaults.phone,
    },
  });

  if (!mounted) return null;

  const sub = cartSubtotal(lines);

  // Shipping calculation
  let ship = sub >= freeThreshold ? 0 : shippingFee;
  if (appliedCoupon?.freeShipping) {
    ship = 0;
  }

  // Discount and totals
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, sub + ship - discountAmount);

  // Deposit Breakdown (25%)
  const depositAmount = Math.round(finalTotal * 0.25);
  const remainingOnDelivery = finalTotal - depositAmount;

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    if (!couponInput.trim()) {
      setCouponMsg({
        text: isAr ? "يرجى كتابة كود الكوبون أولاً" : "Please enter a coupon code first",
        isError: true,
      });
      return;
    }

    setApplyingCoupon(true);
    const res = await validateCouponAction(couponInput, sub);
    setApplyingCoupon(false);

    if (res.ok) {
      setAppliedCoupon({
        code: res.code,
        discount: res.discount,
        freeShipping: res.freeShipping,
      });
      setCouponMsg({
        text: isAr ? "✨ تم تطبيق الكوبون بنجاح!" : "✨ Coupon applied successfully!",
        isError: false,
      });
    } else {
      setAppliedCoupon(null);
      setCouponMsg({ text: res.error, isError: true });
    }
  };

  async function submit(v: V) {
    setErr(null);

    // Proof validation for prepaid options
    if (paymentMethod !== "COD" && !v.transaction_reference_id?.trim() && !file) {
      setErr(isAr ? "إرفاق إيصال الدفع أو رقم التحويل مطلوب" : t("proofRequired"));
      return;
    }

    setBusy(true);
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => fd.set(k, (val as string) ?? ""));
    fd.set("items", JSON.stringify(lines.map((l) => ({ product_id: l.product_id, qty: l.qty }))));
    fd.set("payment_method", paymentMethod);

    if (appliedCoupon) {
      fd.set("coupon", appliedCoupon.code);
    }
    if (file) fd.set("payment_proof", file);

    const res = await createOrder(fd);
    setBusy(false);

    if (res.ok) {
      clear();
      router.push(`/success/${res.orderId}`);
    } else if (res.error === "AUTH_REQUIRED") {
      router.push("/login?next=/checkout");
    } else {
      setErr(res.error === "PROOF_REQUIRED" ? t("proofRequired") : `Error: ${res.error}`);
    }
  }

  if (lines.length === 0) return <p className="text-cream/60">—</p>;

  const field = (name: keyof V, label: string, type = "text") => (
    <div>
      <label className="label">{label}</label>
      <input type={type} {...register(name)} className="input" />
      {errors[name] && <p className="mt-1 text-xs text-red-400">✕</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {/* Step 1: Shipping Info */}
        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <h2 className="h-display text-3xl">{t("shipping")}</h2>
          {field("customer_name", t("fullName"))}
          {field("customer_phone", t("phone"), "tel")}
          {field("address_line1", t("address1"))}
          {field("address_line2", t("address2"))}
          {field("city", t("city"))}
          <div>
            <label className="label">{t("notes")}</label>
            <textarea {...register("notes")} rows={3} className="input" />
          </div>
          <button
            type="button"
            className="btn-gold"
            onClick={async () => {
              if (await trigger(["customer_name", "customer_phone", "address_line1", "city"])) setStep(2);
            }}
          >
            {t("next")}
          </button>
        </div>

        {/* Step 2: Payment & Coupon */}
        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <h2 className="h-display text-3xl">{t("payment")}</h2>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="label text-gold/90 font-semibold">
              {isAr ? "اختر طريقة الدفع" : "Select Payment Method"}
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {enableInstapay && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("INSTAPAY")}
                  className={`p-4 border text-center transition-all rounded ${
                    paymentMethod === "INSTAPAY"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-white/10 text-cream/70 hover:border-white/30"
                  }`}
                >
                  <p className="font-bold text-sm">{isAr ? "دفع كامل (InstaPay)" : "Full Payment (InstaPay)"}</p>
                </button>
              )}

              {enableDeposit && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("DEPOSIT")}
                  className={`p-4 border text-center transition-all rounded ${
                    paymentMethod === "DEPOSIT"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-white/10 text-cream/70 hover:border-white/30"
                  }`}
                >
                  <p className="font-bold text-sm">{isAr ? "دفع عربون 25%" : "25% Deposit"}</p>
                </button>
              )}

              {enableCOD && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-4 border text-center transition-all rounded ${
                    paymentMethod === "COD"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-white/10 text-cream/70 hover:border-white/30"
                  }`}
                >
                  <p className="font-bold text-sm">{isAr ? "دفع عند الاستلام" : "Cash on Delivery"}</p>
                </button>
              )}
            </div>
          </div>

          {/* Payment Instructions if Prepaid / Deposit */}
          {paymentMethod !== "COD" && (
            <div className="space-y-4">
              <div className="border border-gold2/50 bg-surface p-6 text-center shadow-glow rounded">
                <p className="text-sm text-cream/70">
                  {paymentMethod === "DEPOSIT"
                    ? isAr
                      ? `قم بتحويل مبلغ العربون 25% (${depositAmount} EGP) إلى الرقم:`
                      : `Transfer 25% deposit (${depositAmount} EGP) to:`
                    : t("payInstructions")}
                </p>
                <p dir="ltr" className="h-display gold-text mt-2 text-4xl tracking-widest">
                  {payNumber}
                </p>
              </div>

              <p className="text-sm text-cream/60">{t("proofHelp")}</p>

              {field("transaction_reference_id", t("txn"))}

              <div>
                <label className="label">{t("proof")}</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="input file:me-4 file:border-0 file:bg-gold file:px-3 file:py-1 file:text-ink"
                />
              </div>
            </div>
          )}

          {/* Coupon Input */}
          <div className="pt-2 border-t border-white/10">
            <label className="label">{t("coupon")}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isAr ? "مثال: AURAFIRST" : "E.g. AURAFIRST"}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="input uppercase flex-1"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon}
                className="btn-gold px-5 py-2 text-xs uppercase font-bold disabled:opacity-50"
              >
                {applyingCoupon ? "..." : isAr ? "تطبيق" : "APPLY"}
              </button>
            </div>
            {couponMsg && (
              <p className={`mt-2 text-xs font-medium ${couponMsg.isError ? "text-red-400" : "text-amber-400"}`}>
                {couponMsg.text}
              </p>
            )}
          </div>

          {err && (
            <p className="text-sm text-red-400" role="alert">
              {err}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
              {t("back")}
            </button>
            <button disabled={busy} className="btn-gold flex-1">
              {busy ? t("placing") : t("place")}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Sidebar */}
      <aside className="h-fit border border-white/5 bg-surface p-6 space-y-4 rounded">
        <h3 className="font-semibold text-lg text-amber-500 border-b border-white/10 pb-2">
          {isAr ? "ملخص الطلب" : "Order Summary"}
        </h3>
        {lines.map((l) => (
          <div key={l.product_id} className="flex justify-between py-1 text-sm">
            <span>
              {l.title} × {l.qty}
            </span>
            <span>{money(l.price * l.qty, locale)}</span>
          </div>
        ))}

        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-cream/70">
            <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
            <span>
              {money(sub, locale)} {c("currency")}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-amber-400 font-medium">
              <span>
                {isAr ? "الخصم" : "Discount"} ({appliedCoupon?.code})
              </span>
              <span>
                -{money(discountAmount, locale)} {c("currency")}
              </span>
            </div>
          )}

          <div className="flex justify-between text-cream/70">
            <span>{t("shippingFee")}</span>
            <span>
              {ship === 0 ? (
                <span className="text-amber-400 font-medium">
                  {appliedCoupon?.freeShipping
                    ? isAr
                      ? "مجاني (كوبون)"
                      : "FREE (Coupon)"
                    : t("free")}
                </span>
              ) : (
                money(ship, locale)
              )}
            </span>
          </div>

          <div className="flex justify-between text-lg font-bold text-gold border-t border-white/10 pt-3">
            <span>{t("total")}</span>
            <span>
              {money(finalTotal, locale)} {c("currency")}
            </span>
          </div>

          {/* Breakdown for 25% Deposit */}
          {paymentMethod === "DEPOSIT" && (
            <div className="mt-4 p-3 bg-gold/10 border border-gold/30 rounded space-y-1 text-xs">
              <div className="flex justify-between text-gold font-bold">
                <span>{isAr ? "المطلوب تحويله الآن (25%):" : "Pay Now (25%):"}</span>
                <span>
                  {money(depositAmount, locale)} {c("currency")}
                </span>
              </div>
              <div className="flex justify-between text-cream/70">
                <span>{isAr ? "المتبقي عند الاستلام (75%):" : "Pay on Delivery (75%):"}</span>
                <span>
                  {money(remainingOnDelivery, locale)} {c("currency")}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
