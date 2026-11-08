"use server";

import { supabaseService } from "@/lib/supabase/server";
import { couponDiscount, couponProblem } from "@/lib/coupon";

/** Live preview used by the checkout form. createOrder re-validates with the same rules. */
export async function applyCouponAction(code: string, subtotal: number) {
  try {
    const clean = (code ?? "").trim().toUpperCase();
    if (!clean) return { success: false, error: "كود الخصم مطلوب / Coupon code required" };
    const sub = Math.max(0, Number(subtotal) || 0);

    const { data: coupon, error } = await supabaseService()
      .from("coupons")
      .select("*")
      .ilike("code", clean)
      .eq("is_active", true)
      .maybeSingle();

    if (error) console.error("applyCouponAction query error:", error.message);
    if (!coupon) return { success: false, error: "كود الخصم غير صالح / Invalid coupon" };

    const problem = couponProblem(coupon, sub);
    if (problem) return { success: false, error: problem };

    return {
      success: true,
      coupon: { id: coupon.id, code: coupon.code },
      discountAmount: couponDiscount(coupon, sub),
      freeShipping: Boolean(coupon.free_shipping),
    };
  } catch (err: any) {
    console.error("applyCouponAction exception:", err);
    return { success: false, error: "تعذر تطبيق الكود / Could not apply coupon" };
  }
}
