"use server";

import { supabaseService } from "@/lib/supabase/server";
import { couponDiscount, couponProblem } from "@/lib/coupon";
import { toOfferLines, pocketPackDiscount, bundleDiscount, bundleMissing, packMissing, BUNDLE_TYPES, BUNDLE_SLUG, type BundleType, type OfferHint } from "@/lib/offers";
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

/** Active offer coupons this cart already qualifies for (used to suggest them to the customer). */
export async function suggestOffers(
  items: { product_id: string; volume?: string; quantity?: number }[] = []
): Promise<{ offers: { code: string; saving: number }[]; hints: OfferHint[] }> {
  const none = { offers: [], hints: [] };
  try {
    const sb = supabaseService();
    const { data: st } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
    if (!getCampaign(st)) return none;
    const wanted = (Array.isArray(items) ? items.slice(0, 30) : []).map((i) => ({
      product_id: String(i?.product_id ?? ""),
      volume: normVolume(i?.volume),
      qty: Math.min(20, Math.max(1, Math.floor(Number(i?.quantity ?? 1)) || 1)),
    }));
    const ids = Array.from(new Set(wanted.map((w) => w.product_id).filter(Boolean)));
    if (!ids.length) return none;
    const [{ data: prods }, { data: coupons }] = await Promise.all([
      sb.from("products").select("*").in("id", ids),
      sb.from("coupons").select("code,type,expires_at,max_uses,used_count").eq("is_active", true).in("type", [...BUNDLE_TYPES]),
    ]);
    const lines = toOfferLines(wanted, new Map((prods ?? []).map((p: any) => [p.id, p])));
    const live = (coupons ?? []).filter((c: any) => (!c.expires_at || new Date(c.expires_at) > new Date()) && !(c.max_uses && Number(c.used_count ?? 0) >= Number(c.max_uses)));
    const offers = live.map((c: any) => ({ code: c.code as string, saving: bundleDiscount(c.type, lines) })).filter((o) => o.saving > 0);
    const hints: OfferHint[] = [];
    for (const c of live as any[]) {
      const type = String(c.type).toUpperCase() as BundleType;
      if (bundleDiscount(type, lines) > 0) continue;
      const m = bundleMissing(type, lines);
      if (m) hints.push({ kind: "bundle", code: c.code, slug: BUNDLE_SLUG[type], type, ...m });
    }
    const pm = packMissing(lines);
    if (pm) hints.push({ kind: "pack", need: pm });
    const left = (h: OfferHint) => (h.kind === "pack" ? h.need : h.need100 + h.need50);
    hints.sort((a, b) => left(a) - left(b));
    return { offers, hints: hints.slice(0, 2) };
  } catch {
    return none;
  }
}
