/**
 * Single place that turns whatever is stored for a product image (a bucket path, a full URL, a URL with an
 * old/typo project ref or the old "products" bucket) into a working Supabase Storage URL.
 */
const BUCKET = "product-images";
const SUPABASE_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadqzg.supabase.co").replace(/\/+$/, "");
export const SUPABASE_STORAGE_URL = `${SUPABASE_BASE}/storage/v1/object/public/${BUCKET}/`;

/** Local, brand-coloured placeholder: no network request, so it can never 404. */
export const DEFAULT_PLACEHOLDER =
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="100%" height="100%" fill="%230B0B0D"/><rect x="15" y="10" width="570" height="780" fill="none" stroke="%23D6B25E" stroke-width="1" stroke-opacity="0.3"/><text x="50%" y="47%" dominant-baseline="middle" text-anchor="middle" fill="%23D6B25E" font-family="serif" font-size="28" letter-spacing="8">A U R A</text><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="%23F5F1E8" fill-opacity="0.5" font-family="sans-serif" font-size="12" letter-spacing="4">EAU DE PARFUM</text></svg>`;

/** Re-points any Supabase storage URL at this project's product-images bucket; leaves other URLs alone. */
export function toStorageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const v = raw.trim();
  if (!v) return "";

  if (/^https?:\/\//i.test(v)) {
    const m = v.match(/^https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/(?:public\/)?[^/]+\/(.+)$/i);
    return m ? `${SUPABASE_STORAGE_URL}${m[1].split("?")[0]}` : v;
  }
  if (v.startsWith("data:")) return v;

  let path = v.replace(/^\/+/, "");
  for (const prefix of [`${BUCKET}/`, "products/"]) {
    if (path.startsWith(prefix)) path = path.slice(prefix.length);
  }
  return path ? `${SUPABASE_STORAGE_URL}${path}` : "";
}

/** All usable image URLs of a product, main image first. Prefers the stored bucket path over any saved URL. */
export function getAllImageUrls(product: any): string[] {
  if (!product) return [];
  const out: string[] = [];
  const rows = Array.isArray(product.product_images) ? [...product.product_images] : [];

  rows.sort((a: any, b: any) => {
    if (a?.is_main !== b?.is_main) return a?.is_main ? -1 : 1;
    return (a?.sort_order ?? a?.order_index ?? 0) - (b?.sort_order ?? b?.order_index ?? 0);
  });

  for (const r of rows) {
    const raw = typeof r === "string" ? r : r?.path || r?.image_url || r?.url;
    const url = toStorageUrl(raw);
    if (url && !out.includes(url)) out.push(url);
  }
  if (!out.length) {
    const url = toStorageUrl(product.image_url || product.image);
    if (url) out.push(url);
  }
  return out;
}

export function getCleanImageUrl(product: any): string {
  return getAllImageUrls(product)[0] ?? DEFAULT_PLACEHOLDER;
}
