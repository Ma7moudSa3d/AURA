import type { Product } from "@/lib/types";

/** Display-only price. The authoritative price is always recomputed in the DB (create_order). */
export function effectivePrice(p: Product, now = new Date()): number {
  const started = !p.discount_start || new Date(p.discount_start) <= now;
  const notEnded = !p.discount_end || new Date(p.discount_end) >= now;
  if (started && notEnded) {
    if (p.discount_price != null) return Number(p.discount_price);
    if (p.discount_percent != null) return Math.round(Number(p.price) * (1 - Number(p.discount_percent) / 100) * 100) / 100;
  }
  return Number(p.price);
}

export const money = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { maximumFractionDigits: 2 }).format(n);

export const title = (p: Product, locale: string) => (locale === "ar" ? p.title_ar : p.title_en);
export const desc = (p: Product, locale: string) => (locale === "ar" ? p.description_ar : p.description_en) ?? "";

export function imageUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

export function waLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
