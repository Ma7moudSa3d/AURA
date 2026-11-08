"use server";

import { supabaseService } from "@/lib/supabase/server";
import { couponDiscount, couponProblem } from "@/lib/coupon";
import { toOfferLines, pocketPackDiscount } from "@/lib/offers";
import { normVolume } from "@/lib/variants";
import { getCampaign } from "@/lib/campaign";

/** Live preview used by the checkout form. createOrder re-validates with the same rules. */
export async function applyCouponAction(code: string, subtotal: number, items: { product_id: string; volume?: string; quantity?: number }[] = []) {
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

    // Prices come from the database, never from the browser.
    const sb = supabaseService();
    const wanted = (Array.isArray(items) ? items.slice(0, 30) : []).map((i) => ({
      product_id: String(i?.product_id ?? ""),
      volume: normVolume(i?.volume),
      qty: Math.min(20, Math.max(1, Math.floor(Number(i?.quantity ?? 1)) || 1)),
    }));
    const ids = Array.from(new Set(wanted.map((w) => w.product_id).filter(Boolean)));
    const { data: prods } = ids.length ? await sb.from("products").select("*").in("id", ids) : { data: [] as any[] };
    const lines = toOfferLines(wanted, new Map((prods ?? []).map((p: any) => [p.id, p])));
    const { data: st } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
    const pack = getCampaign(st) ? pocketPackDiscount(lines).discount : 0;
    const base = Math.max(0, sub - pack);

    const problem = couponProblem(coupon, base, lines);
    if (problem) return { success: false, error: problem };

    return {
      success: true,
      coupon: { id: coupon.id, code: coupon.code },
      discountAmount: couponDiscount(coupon, base, lines),
      freeShipping: Boolean(coupon.free_shipping),
    };
  } catch (err: any) {
    console.error("applyCouponAction exception:", err);
    return { success: false, error: "تعذر تطبيق الكود / Could not apply coupon" };
  }
}
