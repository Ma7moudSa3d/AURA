/**
 * Coupon rules shared by the live preview in checkout (applyCouponAction) and the real
 * order creation (createOrder). Supports both the column names from the migration
 * (type/value) and the variants added later (discount_type/discount_value, discount_percent...).
 */
export function couponProblem(c: any, subtotal: number): string | null {
  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return "انتهت صلاحية هذا الكود / Coupon expired";
  }
  if (c.max_uses && Number(c.used_count ?? 0) >= Number(c.max_uses)) {
    return "تم استنفاد هذا الكود / Coupon usage limit reached";
  }
  if (c.min_order_amount && subtotal < Number(c.min_order_amount)) {
    return `الحد الأدنى للطلب ${c.min_order_amount} ج.م / Minimum order is ${c.min_order_amount} EGP`;
  }
  return null;
}

export function couponDiscount(c: any, subtotal: number): number {
  const type = String(c.type ?? c.discount_type ?? "").toLowerCase();
  const value = Number(c.value ?? c.discount_value ?? 0);
  const pct = Number(c.discount_percent ?? 0);
  const amt = Number(c.discount_amount ?? 0);

  let d = 0;
  if (pct > 0) d = (subtotal * pct) / 100;
  else if (amt > 0) d = amt;
  else if (type === "percent" || type === "percentage") d = (subtotal * value) / 100;
  else d = value;

  if (c.max_discount_amount) d = Math.min(d, Number(c.max_discount_amount));
  return Math.round(Math.min(Math.max(d, 0), subtotal) * 100) / 100;
}
