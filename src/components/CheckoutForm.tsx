"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCartStore, CartItem } from "@/lib/cart-store";
import { createOrder } from "@/app/actions/order";
import { applyCouponAction } from "@/app/actions/coupon";
import { Check, ShieldCheck, Truck, Lock, AlertCircle, Upload, Banknote, CreditCard, PieChart } from "lucide-react";

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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Totals calculation
  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const itemPrice = item.price ?? item.product?.price ?? 0;
    return sum + itemPrice * item.quantity;
  }, 0);

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const currentShippingFee = netSubtotal >= freeThreshold || items.length === 0 ? 0 : shippingFee;
  const totalAmount = netSubtotal + currentShippingFee;

  // Deposit calculation (25%)
  const depositAmount = Math.round(totalAmount * 0.25);
  const remainingBalance = totalAmount - depositAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await applyCouponAction(couponCode.trim(), subtotal);
      if (res.success && res.coupon) {
        setAppliedCoupon({
          id: res.coupon.id,
          code: res.coupon.code,
          discount: res.discountAmount ?? 0,
        });
        setCouponError(null);
      } else {
        setCouponError(res.error || (isAr ? "كوبون غير صالح" : "Invalid coupon"));
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

      // Format order items including volume variant info
      const orderItems = items.map((i: CartItem) => ({
        product_id: i.product_id,
        volume: i.volume || "100ml",
        title: `${i.product?.title_en || "Perfume"} (${i.volume || "100ml"})`,
        price: i.price ?? i.product?.price ?? 0,
        quantity: i.quantity,
      }));
      formData.append("items", JSON.stringify(orderItems));

      if (proofFile) {
        formData.append("proof", proofFile);
      }

      const res = await createOrder(formData);

      if (res.success && res.orderId) {
        clearCart();
        router.push(`/checkout/success?orderId=${res.orderId}`);
      } else {
        setErrorMsg(res.error || (isAr ? "فشل إنشاء الطلب، حاول مرة أخرى" : "Failed to create order, please try again"));
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Form Column */}
      <div className="lg:col-span-7 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal & Shipping Information */}
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-amber-500/20 via-white/5 to-transparent">
            <div className="bg-neutral-900/90 rounded-[15px] p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-xl font-medium tracking-wide border-b border-white/10 pb-3 text-amber-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                {isAr ? "بيانات الشحن والعنوان" : "Shipping Details"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                    {isAr ? "الاسم بالكامل *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/60 transition"
                    placeholder={isAr ? "أحمد محمد" : "John Doe"}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                    {isAr ? "رقم الهاتف *" : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/60 transition"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  {isAr ? "المحافظة *" : "Governorate *"}
                </label>
                <input
                  type="text"
                  required
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/60 transition"
                  placeholder={isAr ? "القاهرة / الجيزة / الإسكندرية..." : "Cairo, Giza, Alexandria..."}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  {isAr ? "العنوان بالتفصيل (الشارع / العمارة / الشقة) *" : "Detailed Address *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/60 transition resize-none"
                  placeholder={isAr ? "اسم الشارع، رقم المبنى، رقم الشقة..." : "Street name, building number, apartment..."}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-amber-500/20 via-white/5 to-transparent">
            <div className="bg-neutral-900/90 rounded-[15px] p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-xl font-medium tracking-wide border-b border-white/10 pb-3 text-amber-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                {isAr ? "طريقة الدفع" : "Payment Method"}
              </h2>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* InstaPay Option */}
                {enableInstapay && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      paymentMethod === "INSTAPAY"
                        ? "bg-amber-500/10 border-amber-500/60 text-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="INSTAPAY"
                      checked={paymentMethod === "INSTAPAY"}
                      onChange={() => setPaymentMethod("INSTAPAY")}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {isAr ? "دفع كامل عبر InstaPay" : "Full Payment via InstaPay"}
                        </span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded uppercase font-mono">
                          InstaPay
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
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
                        ? "bg-amber-500/10 border-amber-500/60 text-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="DEPOSIT"
                      checked={paymentMethod === "DEPOSIT"}
                      onChange={() => setPaymentMethod("DEPOSIT")}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <PieChart className="w-4 h-4 text-amber-400" />
                          {isAr ? "عربون 25% والباقي عند الاستلام" : "25% Deposit + COD Balance"}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-mono">
                          25% Deposit
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
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
                        ? "bg-amber-500/10 border-amber-500/60 text-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-amber-400" />
                          {isAr ? "الدفع عند الاستلام (كاش)" : "Cash on Delivery (COD)"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
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
                <div className="mt-4 p-4 rounded-xl bg-neutral-950/80 border border-amber-500/30 space-y-3">
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <p className="font-semibold text-amber-400 mb-1">
                      {isAr ? "تعليمات التحويل:" : "Transfer Instructions:"}
                    </p>
                    <p>
                      1. {isAr ? "افتح تطبيق InstaPay وقم بتحويل مبلغ" : "Open InstaPay app and transfer"}{" "}
                      <strong className="text-white underline">
                        {paymentMethod === "DEPOSIT" ? `${depositAmount} EGP` : `${totalAmount} EGP`}
                      </strong>{" "}
                      {isAr ? "إلى الرقم:" : "to phone:"}{" "}
                      <span className="font-mono bg-neutral-900 px-2 py-0.5 rounded text-amber-300 select-all">
                        {payNumber}
                      </span>
                    </p>
                    <p className="mt-1">
                      2. {isAr ? "قم بإلتقاط صورة لشاشة إيصال التحويل وترفيقها بالأسفل." : "Take a screenshot of the payment receipt and upload below."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      {isAr ? "إرفاق إيصال التحويل (صورة) *" : "Upload Payment Receipt (Image) *"}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg cursor-pointer text-xs text-neutral-200 transition">
                        <Upload className="w-4 h-4 text-amber-400" />
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
                          className="h-28 rounded-lg border border-neutral-700 object-cover"
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
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || items.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold tracking-wide uppercase shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-base"
          >
            <Lock className="w-5 h-5" />
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
        <div className="p-[1px] rounded-2xl bg-gradient-to-b from-amber-500/20 via-white/5 to-transparent sticky top-24">
          <div className="bg-neutral-900/90 rounded-[15px] p-6 space-y-6 backdrop-blur-md">
            <h2 className="text-xl font-medium tracking-wide border-b border-white/10 pb-3 text-amber-100">
              {isAr ? "ملخص الطلب" : "Order Summary"}
            </h2>

            {/* Cart Items List */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {items.map((item: CartItem) => {
                const itemPrice = item.price ?? item.product?.price ?? 0;
                return (
                  <div key={item.id} className="flex gap-3 items-center border-b border-neutral-800/60 pb-3 last:border-0">
                    <div className="w-14 h-14 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.title_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                          AURA
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-200 truncate">
                        {isAr ? item.product?.title_ar || item.product?.title_en : item.product?.title_en}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {isAr ? "الحجم:" : "Volume:"} <span className="text-amber-300 font-medium">{item.volume || "100ml"}</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.quantity} × {itemPrice} EGP
                      </p>
                    </div>
                    <div className="text-right font-medium text-sm text-neutral-200">
                      {itemPrice * item.quantity} EGP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="block text-xs uppercase tracking-wider text-neutral-400">
                {isAr ? "كود الخصم (كوبون)" : "Discount Coupon"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="AURAFIRST"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 uppercase tracking-widest focus:outline-none focus:border-amber-500/60"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold uppercase tracking-wider disabled:opacity-50 transition"
                >
                  {isApplyingCoupon ? "..." : isAr ? "تطبيق" : "Apply"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {isAr ? `تم تطبيق الكوبون (${appliedCoupon.code})` : `Coupon applied (${appliedCoupon.code})`}
                </p>
              )}
              {couponError && <p className="text-xs text-red-400">{couponError}</p>}
            </div>

            {/* Financial Totals */}
            <div className="space-y-2 pt-3 border-t border-white/10 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                <span>{subtotal} EGP</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{isAr ? "الخصم" : "Discount"}</span>
                  <span>-{discountAmount} EGP</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-400">
                <span>{isAr ? "رسوم الشحن" : "Shipping"}</span>
                <span>
                  {currentShippingFee === 0 ? (
                    <span className="text-emerald-400 font-medium">{isAr ? "مجاني" : "FREE"}</span>
                  ) : (
                    `${currentShippingFee} EGP`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold text-amber-100 pt-3 border-t border-neutral-800">
                <span>{isAr ? "الإجمالي الكلي" : "Total"}</span>
                <span className="text-amber-400">{totalAmount} EGP</span>
              </div>

              {/* Deposit Breakdown */}
              {paymentMethod === "DEPOSIT" && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <div className="flex justify-between text-amber-300 font-medium">
                    <span>{isAr ? "العربون المطلوب الآن (25%):" : "Deposit Required Now (25%):"}</span>
                    <span>{depositAmount} EGP</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>{isAr ? "المتبقي عند الاستلام:" : "Balance on Delivery:"}</span>
                    <span>{remainingBalance} EGP</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-500/80" />
              <span>{isAr ? "دفع آمن 100% ومشفر بواسطة AURA" : "100% Secure Checkout Guaranteed"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
