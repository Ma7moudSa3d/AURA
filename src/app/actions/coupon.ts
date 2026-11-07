"use server";

import { createClient } from "@/lib/supabase/server";

export async function applyCouponAction(code: string, subtotal: number) {
  try {
    if (!code || !code.trim()) {
      return { success: false, error: "كود الخصم مطلوب / Coupon code required" };
    }

    const supabase = await createClient();
    const cleanCode = code.trim().toUpperCase();

    // Query active coupon from database
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching coupon:", error);
    }

    // Special fallback for AURAFIRST default code if coupons table is empty
    if (!coupon && cleanCode === "AURAFIRST") {
      const discountAmount = Math.round(subtotal * 0.10); // 10% discount
      return {
        success: true,
        coupon: {
          id: "aurafirst-default",
          code: "AURAFIRST",
          discount_type: "percentage",
          discount_value: 10,
        },
        discountAmount,
      };
    }

    if (!coupon) {
      return { success: false, error: "كود الخصم غير صالح أو انتهت صلاحيته / Invalid or expired coupon" };
    }

    // Check expiration date if present
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { success: false, error: "انتهت صلاحية هذا الكود / Coupon expired" };
    }

    // Check min order amount
    if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
      return {
        success: false,
        error: `الحد الأدنى لاستخدام هذا الكود هو ${coupon.min_order_amount} ج.م / Minimum order for this coupon is ${coupon.min_order_amount} EGP`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = Math.round((subtotal * Number(coupon.discount_value)) / 100);
      if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
        discountAmount = Number(coupon.max_discount_amount);
      }
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      discountAmount,
    };
  } catch (err: any) {
    console.error("applyCouponAction exception:", err);
    return { success: false, error: err.message || "Failed to apply coupon" };
  }
}
