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
}: {
  defaults: { name: string; phone: string };
  shippingFee: number;
  freeThreshold: number;
  payNumber: string;
}) {
  const t = useTranslations("checkout");
  const c = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { lines, clear } = useCart();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  // Shipping calculation (Checking Coupon Free Shipping)
  let ship = sub >= freeThreshold ? 0 : shippingFee;
  if (appliedCoupon?.freeShipping) {
    ship = 0;
  }

  // Discount calculation
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, sub + ship - discountAmount);

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    if (!couponInput.trim()) {
      setCouponMsg({ text: "يرجى كتابة كود الكوبون أولاً", isError: true });
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
      setCouponMsg({ text: "✨ تم تطبيق الكوبون بنجاح!", isError: false });
    } else {
      setAppliedCoupon(null);
      setCouponMsg({ text: res.error, isError: true });
    }
  };

  async function submit(v: V) {
    setErr(null);
    if (!v.transaction_reference_id?.trim() && !file) {
      setErr(t("proofRequired"));
      return;
    }

    setBusy(true);
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => fd.set(k, (val as string) ?? ""));
    fd.set("items", JSON.stringify(lines.map((l) => ({ product_id: l.product_id, qty: l.qty }))));
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
          <div className="border border-gold2/50 bg-surface p-6 text-center shadow-glow">
            <p className="text-sm text-cream/70">{t("payInstructions")}</p>
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

          {/* Coupon Input with APPLY button */}
          <div>
            <label className="label">{t("coupon")}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. AURAFIRST"
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
                {applyingCoupon ? "..." : "APPLY"}
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
      <aside className="h-fit border border-white/5 bg-surface p-6 space-y-4">
        <h3 className="font-semibold text-lg text-amber-500 border-b border-white/10 pb-2">Order Summary</h3>
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
            <span>Subtotal</span>
            <span>{money(sub, locale)} {c("currency")}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-amber-400 font-medium">
              <span>Discount ({appliedCoupon?.code})</span>
              <span>-{money(discountAmount, locale)} {c("currency")}</span>
            </div>
          )}

          <div className="flex justify-between text-cream/70">
            <span>{t("shippingFee")}</span>
            <span>
              {ship === 0 ? (
                <span className="text-amber-400 font-medium">
                  {appliedCoupon?.freeShipping ? "FREE (Coupon)" : t("free")}
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
        </div>
      </aside>
    </form>
  );
}
