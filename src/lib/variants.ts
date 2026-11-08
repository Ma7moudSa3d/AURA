/**
 * Single source of truth for size pricing.
 * Used by the product page / cards (what the customer sees) AND by createOrder (what the customer is charged),
 * so the two can never disagree.
 *
 * Real sizes come from products.variants (edited in the admin product form). Products without any
 * variants fall back to fixed factors of the 50ML price.
 */
export type Variant = { volume: string; price: number; stock_qty?: number };

export const FALLBACK_FACTORS: Record<string, number> = { "5ML": 0.2, "30ML": 0.65, "50ML": 1, "100ML": 1.55 };
export const DEFAULT_VOLUME = "50ML";
export const VOLUMES = Object.keys(FALLBACK_FACTORS);

export const normVolume = (v?: unknown): string =>
  String(v ?? DEFAULT_VOLUME).toUpperCase().replace(/\s+/g, "") || DEFAULT_VOLUME;

const vol = (v: string) => parseInt(v) || 0;

/** The discounted price when there is one, otherwise the list price. */
export const basePriceOf = (p: { price?: unknown; discount_price?: unknown }): number => {
  const d = Number(p?.discount_price);
  return d > 0 ? d : Number(p?.price) || 0;
};

export function resolveVariants(p: any): Variant[] {
  if (Array.isArray(p?.variants) && p.variants.length > 0) {
    return p.variants
      .map((v: any) => ({
        volume: normVolume(v?.volume),
        price: basePriceOf(v),
        stock_qty: v?.stock_qty === undefined || v?.stock_qty === null ? undefined : Number(v.stock_qty),
      }))
      .sort((a: Variant, b: Variant) => vol(a.volume) - vol(b.volume));
  }
  const base = basePriceOf(p);
  return VOLUMES.map((v) => ({ volume: v, price: Math.round(base * FALLBACK_FACTORS[v]) }));
}

/** Variant matching `volume` (case-insensitive); falls back to 50ML, then to the first one. */
export function pickVariant(p: any, volume?: unknown): Variant {
  const list = resolveVariants(p);
  const want = normVolume(volume);
  return list.find((v) => v.volume === want) ?? list.find((v) => v.volume === DEFAULT_VOLUME) ?? list[0];
}

export const minPrice = (p: any): number => Math.min(...resolveVariants(p).map((v) => v.price));
