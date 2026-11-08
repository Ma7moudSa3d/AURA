"use client";

import { useEffect, useState, useTransition } from "react";
import { useCampaign, OfferSuggestion } from "@/components/Campaign";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCartStore } from "@/lib/cart-store";
import { createOrder } from "@/app/actions/order";
import { applyCouponAction } from "@/app/actions/coupon";
import { pocketPackDiscount, type OfferLine } from "@/lib/offers";

function IconTruck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.25 2.25 0 0 0-1.802-.87H15M3.375 14.25a2.25 2.25 0 0 0 2.25 2.25h1.5m-3.75-2.25V5.25A2.25 2.25 0 0 1 5.625 3h8.25a2.25 2.25 0 0 1 2.25 2.25v1.875" />
    </svg>
  );
}

function IconCreditCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5z" />
    </svg>
  );
}

function IconBanknote(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v.375c0 .621.504 1.125 1.125 1.125H20.25M2.25 6v9m18-9v9m0-9a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6m19.5 0v9a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 15" />
    </svg>
  );
}

function IconPieChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5z" />
    </svg>
  );
}

function IconUpload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
    </svg>
  );
}

function IconAlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

export interface CheckoutFormProps {
  defaults?: { name?: string; phone?: string };
  shippingFee?: number;
  freeThreshold?: number;
  payNumber?: string;
  enableCOD?: boolean;
  enableInstapay?: boolean;
  enableDeposit?: boolean;
  [key: string]: any;
}

export function CheckoutForm({
  defaults,
  shippingFee = 60,
  freeThreshold = 2000,
  payNumber = "01016267377",
  enableCOD = true,
  enableInstapay = true,
  enableDeposit = true,
}: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const { items, clearCart } = useCartStore();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [fullName, setFullName] = useState(defaults?.name || "");
  const [phone, setPhone] = useState(defaults?.phone || "");
  const [governorate, setGovernorate] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "INSTAPAY" | "DEPOSIT">("INSTAPAY");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Coupon state
  const campaign = useCampaign();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Totals calculation safely handling undefined quantity
  const subtotal = items.reduce((sum: number, item: any) => {
    const itemPrice = item.price ?? item.product?.price ?? 0;
    const qty = item.quantity ?? item.qty ?? 1;
    return sum + itemPrice * qty;
  }, 0);

  // Pocket Pack (campaign offer) is applied automatically; coupons are calculated on what is left.
  const offerLines: OfferLine[] = items.map((i: any) => ({
    product_id: i.product_id,
    volume: i.volume || "50ML",
    qty: i.quantity ?? i.qty ?? 1,
    unit: i.price ?? 0,
  }));
  const packDiscount = campaign ? pocketPackDiscount(offerLines).discount : 0;
  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const discountAmount = packDiscount + couponDiscountAmount;
  const netSubtotal = Math.max(0, subtotal - discountAmount);

  // A coupon result depends on the cart: drop it when the cart changes so the customer re-applies it.
  const cartKey = JSON.stringify(offerLines);
  useEffect(() => { setAppliedCoupon(null); }, [cartKey]);
  const currentShippingFee = netSubtotal >= freeThreshold || items.length === 0 ? 0 : shippingFee;
  const totalAmount = netSubtotal + currentShippingFee;

  // Deposit calculation (25%)
  const depositAmount = Math.round(totalAmount * 0.25);
  const remainingBalance = totalAmount - depositAmount;

  const handleApplyCoupon = async (override?: string) => {
    const codeToUse = (typeof override === "string" ? override : couponCode).trim();
    if (!codeToUse) return;
    setCouponCode(codeToUse);
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res: any = await applyCouponAction(
        codeToUse,
        subtotal,
        items.map((i: any) => ({ product_id: i.product_id, volume: i.volume || "50ML", quantity: i.quantity ?? i.qty ?? 1 }))
      );
      if ((res?.ok || res?.success) && res?.coupon) {
        setAppliedCoupon({
          id: res.coupon.id,
          code: res.coupon.code,
          discount: res.discountAmount ?? 0,
        });
        setCouponError(null);
      } else {
        setCouponError(res?.error || (isAr ? "كوبون غير صالح" : "Invalid coupon"));
      }
    } catch (err: any) {
      setCouponError(isAr ? "حدث خطأ أثناء تطبيق الكوبون" : "Error applying coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg(isAr ? "السلة فارغة" : "Cart is empty");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !governorate.trim() || !addressDetails.trim()) {
      setErrorMsg(isAr ? "يرجى إكمال جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    // Proof file required for InstaPay and Deposit
    if ((paymentMethod === "INSTAPAY" || paymentMethod === "DEPOSIT") && !proofFile) {
      setErrorMsg(isAr ? "يرجى إرفاق إيصال التحويل" : "Please upload transfer receipt");
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("phone", phone);
      formData.append("governorate", governorate);
      formData.append("address_details", addressDetails);
      formData.append("payment_method", paymentMethod);
      formData.append("subtotal", subtotal.toString());
      formData.append("discount_amount", discountAmount.toString());
      formData.append("shipping_fee", currentShippingFee.toString());
      formData.append("total_amount", totalAmount.toString());
      formData.append("deposit_amount", paymentMethod === "DEPOSIT" ? depositAmount.toString() : "0");
      formData.append("remaining_balance", paymentMethod === "DEPOSIT" ? remainingBalance.toString() : "0");

      if (appliedCoupon) {
        formData.append("coupon_id", appliedCoupon.id);
        formData.append("coupon_code", appliedCoupon.code);
      }

      // Only ids, size and quantity are trusted by the server; it recomputes every price itself.
      const orderItems = items.map((i: any) => ({
        product_id: i.product_id,
        volume: i.volume || "50ML",
        quantity: i.quantity ?? i.qty ?? 1,
      }));
      formData.append("items", JSON.stringify(orderItems));

      if (proofFile) {
        formData.append("proof", proofFile);
      }

      const res: any = await createOrder(formData);

      if ((res?.ok || res?.success) && res?.orderId) {
        clearCart();
        router.push(`/success/${res.orderId}`);
      } else {
        setErrorMsg(res?.error || (isAr ? "فشل إنشاء الطلب، حاول مرة أخرى" : "Failed to create order, please try again"));
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Form Column */}
      <div className="lg:col-span-7 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal & Shipping Information */}
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-gold/20 via-white/5 to-transparent">
            <div className="bg-surface/90 rounded-[15px] p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-xl font-medium tracking-wide border-b border-white/10 pb-3 text-cream flex items-center gap-2">
                <IconTruck className="w-5 h-5 text-gold" />
                {isAr ? "بيانات الشحن والعنوان" : "Shipping Details"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-cream/60 mb-1.5">
                    {isAr ? "الاسم بالكامل *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-cream focus:outline-none focus:border-gold/60 transition"
                    placeholder={isAr ? "أحمد محمد" : "John Doe"}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-cream/60 mb-1.5">
                    {isAr ? "رقم الهاتف *" : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-cream focus:outline-none focus:border-gold/60 transition"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-cream/60 mb-1.5">
                  {isAr ? "المحافظة *" : "Governorate *"}
                </label>
                <input
                  type="text"
                  required
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-cream focus:outline-none focus:border-gold/60 transition"
                  placeholder={isAr ? "القاهرة / الجيزة / الإسكندرية..." : "Cairo, Giza, Alexandria..."}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-cream/60 mb-1.5">
                  {isAr ? "العنوان بالتفصيل (الشارع / العمارة / الشقة) *" : "Detailed Address *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  className="w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-cream focus:outline-none focus:border-gold/60 transition resize-none"
                  placeholder={isAr ? "اسم الشارع، رقم المبنى، رقم الشقة..." : "Street name, building number, apartment..."}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-gold/20 via-white/5 to-transparent">
            <div className="bg-surface/90 rounded-[15px] p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-xl font-medium tracking-wide border-b border-white/10 pb-3 text-cream flex items-center gap-2">
                <IconCreditCard className="w-5 h-5 text-gold" />
                {isAr ? "طريقة الدفع" : "Payment Method"}
              </h2>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* InstaPay Option */}
                {enableInstapay && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      paymentMethod === "INSTAPAY"
                        ? "bg-gold/10 border-gold/60 text-cream"
                        : "bg-ink border-white/10 text-cream/70 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="INSTAPAY"
                      checked={paymentMethod === "INSTAPAY"}
                      onChange={() => setPaymentMethod("INSTAPAY")}
                      className="mt-1 accent-gold"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {isAr ? "دفع كامل عبر InstaPay" : "Full Payment via InstaPay"}
                        </span>
                        <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded uppercase font-mono">
                          InstaPay
                        </span>
                      </div>
                      <p className="text-xs text-cream/60 mt-1">
                        {isAr
                          ? `تحويل المبلغ بالكامل إلى الرقم: ${payNumber}`
                          : `Transfer total amount to: ${payNumber}`}
                      </p>
                    </div>
                  </label>
                )}

                {/* 25% Deposit Option */}
                {enableDeposit && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      paymentMethod === "DEPOSIT"
                        ? "bg-gold/10 border-gold/60 text-cream"
                        : "bg-ink border-white/10 text-cream/70 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="DEPOSIT"
                      checked={paymentMethod === "DEPOSIT"}
                      onChange={() => setPaymentMethod("DEPOSIT")}
                      className="mt-1 accent-gold"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <IconPieChart className="w-4 h-4 text-gold" />
                          {isAr ? "عربون 25% والباقي عند الاستلام" : "25% Deposit + COD Balance"}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-mono">
                          25% Deposit
                        </span>
                      </div>
                      <p className="text-xs text-cream/60 mt-1">
                        {isAr
                          ? `دفع عربون بقيمة ${depositAmount} ج.م الآن عبر InstaPay والمتبقي (${remainingBalance} ج.م) كاش عند الاستلام`
                          : `Pay ${depositAmount} EGP deposit via InstaPay now, remaining (${remainingBalance} EGP) on delivery`}
                      </p>
                    </div>
                  </label>
                )}

                {/* Cash on Delivery Option */}
                {enableCOD && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      paymentMethod === "COD"
                        ? "bg-gold/10 border-gold/60 text-cream"
                        : "bg-ink border-white/10 text-cream/70 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 accent-gold"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <IconBanknote className="w-4 h-4 text-gold" />
                          {isAr ? "الدفع عند الاستلام (كاش)" : "Cash on Delivery (COD)"}
                        </span>
                      </div>
                      <p className="text-xs text-cream/60 mt-1">
                        {isAr
                          ? "دفع المبلغ بالكامل نقدًا لمندوب الشحن عند التسليم"
                          : "Pay full amount in cash upon receiving your order"}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* InstaPay Transfer Info & Receipt Upload */}
              {(paymentMethod === "INSTAPAY" || paymentMethod === "DEPOSIT") && (
                <div className="mt-4 p-4 rounded-xl bg-ink/80 border border-gold/30 space-y-3">
                  <div className="text-xs text-cream/90 leading-relaxed">
                    <p className="font-semibold text-gold mb-1">
                      {isAr ? "تعليمات التحويل:" : "Transfer Instructions:"}
                    </p>
                    <p>
                      1. {isAr ? "افتح تطبيق InstaPay وقم بتحويل مبلغ" : "Open InstaPay app and transfer"}{" "}
                      <strong className="text-cream underline">
                        {paymentMethod === "DEPOSIT" ? `${depositAmount} EGP` : `${totalAmount} EGP`}
                      </strong>{" "}
                      {isAr ? "إلى الرقم:" : "to phone:"}{" "}
                      <span className="font-mono bg-surface px-2 py-0.5 rounded text-gold select-all">
                        {payNumber}
                      </span>
                    </p>
                    <p className="mt-1">
                      2. {isAr ? "قم بإلتقاط صورة لشاشة إيصال التحويل وترفيقها بالأسفل." : "Take a screenshot of the payment receipt and upload below."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-cream/60 mb-1.5">
                      {isAr ? "إرفاق إيصال التحويل (صورة) *" : "Upload Payment Receipt (Image) *"}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface2 border border-white/15 rounded-lg cursor-pointer text-xs text-cream/80 transition">
                        <IconUpload className="w-4 h-4 text-gold" />
                        <span>{proofFile ? proofFile.name : isAr ? "اختر صورة الإيصال..." : "Choose Image File..."}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {proofPreview && (
                      <div className="mt-3">
                        <img
                          src={proofPreview}
                          alt="Receipt Preview"
                          className="h-28 rounded-lg border border-white/15 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <IconAlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || items.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-gold to-gold2 hover:brightness-110 text-ink font-bold tracking-wide uppercase shadow-lg shadow-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-base"
          >
            <IconLock className="w-5 h-5" />
            {isPending
              ? isAr
                ? "جاري تأكيد الطلب..."
                : "Processing Order..."
              : isAr
              ? `تأكيد الطلب • ${totalAmount} ج.م`
              : `Confirm Order • ${totalAmount} EGP`}
          </button>
        </form>
      </div>

      {/* Summary Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-[1px] rounded-2xl bg-gradient-to-b from-gold/20 via-white/5 to-transparent sticky top-24">
          <div className="bg-surface/90 rounded-[15px] p-6 space-y-6 backdrop-blur-md">
            <h2 className="text-xl font-medium tracking-wide border-b border-white/10 pb-3 text-cream">
              {isAr ? "ملخص الطلب" : "Order Summary"}
            </h2>

            {/* Cart Items List */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {items.map((item: any) => {
                const itemPrice = item.price ?? item.product?.price ?? 0;
                const qty = item.quantity ?? item.qty ?? 1;
                return (
                  <div key={item.id} className="flex gap-3 items-center border-b border-white/10 pb-3 last:border-0">
                    <div className="w-14 h-14 bg-ink border border-white/10 rounded-lg overflow-hidden shrink-0">
                      {(item.image || item.image_url || item.product?.image_url) ? (
                        <img
                          src={item.image || item.image_url || item.product?.image_url}
                          alt={item.name || item.title_en || item.product?.title_en || "AURA"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-cream/40">
                          AURA
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-cream/80 truncate">
                        {isAr ? item.title_ar || item.name || item.title_en || item.product?.title_ar : item.name || item.title_en || item.product?.title_en}
                      </h4>
                      <p className="text-xs text-cream/60">
                        {isAr ? "الحجم:" : "Volume:"} <span className="text-gold font-medium">{item.volume || "50ML"}</span>
                      </p>
                      <p className="text-xs text-cream/50 mt-0.5">
                        {qty} × {itemPrice} EGP
                      </p>
                    </div>
                    <div className="text-right font-medium text-sm text-cream/80">
                      {itemPrice * qty} EGP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="block text-xs uppercase tracking-wider text-cream/60">
                {isAr ? "كود الخصم (كوبون)" : "Discount Coupon"}
              </label>
              <OfferSuggestion
                items={items.map((i: any) => ({ product_id: i.product_id, volume: i.volume || "50ML", quantity: i.quantity ?? i.qty ?? 1 }))}
                appliedCode={appliedCoupon?.code}
                onApply={(c) => handleApplyCoupon(c)}
              />
              {campaign?.code && !appliedCoupon && (
                <button
                  type="button"
                  onClick={() => setCouponCode(campaign.code!)}
                  className="w-full border border-dashed border-gold/60 bg-gold/5 px-3 py-2 text-start text-xs text-gold hover:bg-gold/10"
                >
                  ✦ {isAr ? `الجمعة الذهبية: اضغط لاستخدام الكود ${campaign.code}` : `Golden Friday: tap to use code ${campaign.code}`}
                </button>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="AURAFIRST"
                  className="flex-1 bg-ink border border-white/10 rounded-lg px-3 py-2 text-xs text-cream uppercase tracking-widest focus:outline-none focus:border-gold/60"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-surface2 hover:bg-surface2 text-cream rounded-lg text-xs font-semibold uppercase tracking-wider disabled:opacity-50 transition"
                >
                  {isApplyingCoupon ? "..." : isAr ? "تطبيق" : "Apply"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <IconCheck className="w-3.5 h-3.5" />
                  {isAr ? `تم تطبيق الكوبون (${appliedCoupon.code})` : `Coupon applied (${appliedCoupon.code})`}
                </p>
              )}
              {couponError && <p className="text-xs text-red-400">{couponError}</p>}
            </div>

            {/* Financial Totals */}
            <div className="space-y-2 pt-3 border-t border-white/10 text-sm">
              <div className="flex justify-between text-cream/60">
                <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                <span>{subtotal} EGP</span>
              </div>

              {packDiscount > 0 && (
                <div className="flex justify-between text-gold">
                  <span>✦ {isAr ? "باكيدج الجيب" : "Pocket Pack"}</span>
                  <span>-{packDiscount} EGP</span>
                </div>
              )}
              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{isAr ? "الخصم" : "Discount"} ({appliedCoupon?.code})</span>
                  <span>-{couponDiscountAmount} EGP</span>
                </div>
              )}

              <div className="flex justify-between text-cream/60">
                <span>{isAr ? "رسوم الشحن" : "Shipping"}</span>
                <span>
                  {currentShippingFee === 0 ? (
                    <span className="text-emerald-400 font-medium">{isAr ? "مجاني" : "FREE"}</span>
                  ) : (
                    `${currentShippingFee} EGP`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold text-cream pt-3 border-t border-white/10">
                <span>{isAr ? "الإجمالي الكلي" : "Total"}</span>
                <span className="text-gold">{totalAmount} EGP</span>
              </div>

              {/* Deposit Breakdown */}
              {paymentMethod === "DEPOSIT" && (
                <div className="mt-4 p-3 rounded-lg bg-gold/10 border border-gold/30 text-xs space-y-1">
                  <div className="flex justify-between text-gold font-medium">
                    <span>{isAr ? "العربون المطلوب الآن (25%):" : "Deposit Required Now (25%):"}</span>
                    <span>{depositAmount} EGP</span>
                  </div>
                  <div className="flex justify-between text-cream/60">
                    <span>{isAr ? "المتبقي عند الاستلام:" : "Balance on Delivery:"}</span>
                    <span>{remainingBalance} EGP</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-cream/50 flex items-center justify-center gap-1">
              <IconShieldCheck className="w-4 h-4 text-gold/80" />
              <span>{isAr ? "دفع آمن 100% ومشفر بواسطة AURA" : "100% Secure Checkout Guaranteed"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
