/**
 * Golden Friday offers. Pure functions shared by the checkout preview (browser) and createOrder (server),
 * so the customer always sees the same discount that is charged.
 */
import { normVolume, pickVariant } from "@/lib/variants";

export type OfferLine = { product_id: string; volume: string; qty: number; unit: number };

export const BUNDLE_TYPES = ["BUNDLE_2X100_FREE50", "BUNDLE_2X50_THIRD_HALF"] as const;
export type BundleType = (typeof BUNDLE_TYPES)[number];
export const isBundleType = (t: unknown): t is BundleType => BUNDLE_TYPES.includes(String(t ?? "").toUpperCase() as BundleType);

export const POCKET_PACK_PRICE = 350;
export const POCKET_PACK_SIZE = 7;
export const POCKET_PACK_VOLUME = "5ML";

export const BUNDLE_HELP: Record<BundleType, { ar: string; en: string }> = {
  BUNDLE_2X100_FREE50: {
    ar: "العرض يحتاج في السلة: زجاجتين 100ML + زجاجة 50ML (تكون مجانية)",
    en: "This offer needs in your cart: two 100ML bottles + one 50ML bottle (the 50ML is free)",
  },
  BUNDLE_2X50_THIRD_HALF: {
    ar: "العرض يحتاج في السلة: 3 زجاجات 50ML (الثالثة بنصف السعر)",
    en: "This offer needs in your cart: three 50ML bottles (the third at 50% off)",
  },
};

const units = (lines: OfferLine[], volume: string) => {
  const out: number[] = [];
  for (const l of lines) if (normVolume(l.volume) === volume) for (let i = 0; i < l.qty; i++) out.push(l.unit);
  return out;
};

/** EGP discount a bundle coupon gives for these cart lines (0 = cart does not qualify). */
export function bundleDiscount(type: unknown, lines: OfferLine[]): number {
  const t = String(type ?? "").toUpperCase();
  if (t === "BUNDLE_2X100_FREE50") {
    const n100 = units(lines, "100ML").length;
    const u50 = units(lines, "50ML").sort((a, b) => a - b); // cheapest 50ML bottles become the free ones
    const sets = Math.min(Math.floor(n100 / 2), u50.length);
    return u50.slice(0, sets).reduce((a, b) => a + b, 0);
  }
  if (t === "BUNDLE_2X50_THIRD_HALF") {
    const u50 = units(lines, "50ML").sort((a, b) => b - a);
    let d = 0;
    for (let i = 2; i < u50.length; i += 3) d += u50[i] * 0.5; // the cheapest of every group of three
    return Math.round(d * 100) / 100;
  }
  return 0;
}

/** Pocket Pack: any 7 different scents in 5ML cost POCKET_PACK_PRICE together. Applied automatically. */
export function pocketPackDiscount(lines: OfferLine[]): { discount: number; sets: number } {
  const remaining = new Map<string, number>();
  const price = new Map<string, number>();
  for (const l of lines) {
    if (normVolume(l.volume) !== POCKET_PACK_VOLUME || !l.product_id) continue;
    remaining.set(l.product_id, (remaining.get(l.product_id) ?? 0) + l.qty);
    price.set(l.product_id, l.unit);
  }
  let discount = 0;
  let sets = 0;
  for (;;) {
    const avail = [...remaining.entries()].filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1]);
    if (avail.length < POCKET_PACK_SIZE) break;
    const take = avail.slice(0, POCKET_PACK_SIZE);
    const sum = take.reduce((a, [id]) => a + (price.get(id) ?? 0), 0);
    for (const [id] of take) remaining.set(id, (remaining.get(id) ?? 0) - 1);
    discount += Math.max(0, sum - POCKET_PACK_PRICE);
    sets++;
  }
  return { discount, sets };
}

/** Builds offer lines from raw cart items + product rows (used on the server with DB prices). */
export function toOfferLines(wanted: { product_id: string; volume: string; qty: number }[], byId: Map<string, any>): OfferLine[] {
  return wanted.map((w) => ({
    product_id: w.product_id,
    volume: normVolume(w.volume),
    qty: w.qty,
    unit: byId.get(w.product_id) ? pickVariant(byId.get(w.product_id), w.volume).price : 0,
  }));
}
