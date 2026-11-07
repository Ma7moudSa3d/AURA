export const DEFAULT_PLACEHOLDER = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
export const SUPABASE_STORAGE_URL = "https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/";

export function getCleanImageUrl(product: any): string {
  if (!product) return DEFAULT_PLACEHOLDER;

  let rawPath = "";

  // 1. فحص جدول product_images أولاً (قراءة path أو image_url)
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const firstImg = product.product_images[0];
    if (typeof firstImg === "string") {
      rawPath = firstImg;
    } else if (firstImg && typeof firstImg === "object") {
      rawPath = firstImg.image_url || firstImg.path || firstImg.url || "";
    }
  }

  // 2. فحص الخانات المباشرة في جدول products
  if (!rawPath) {
    rawPath = product.image_url || product.image || "";
  }

  // 3. إن لم يوجد، نستخدم الـ ID كاسم ملف
  if (!rawPath && product.id) {
    rawPath = String(product.id);
  }

  if (!rawPath || typeof rawPath !== "string") {
    return DEFAULT_PLACEHOLDER;
  }

  const clean = rawPath.trim();
  if (!clean) return DEFAULT_PLACEHOLDER;

  // إذا كان الرابط مكتمل مسبقاً بـ https://
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // تنظيف السلاش والكلمات المكررة
  let sanitized = clean.replace(/^\/+/, "");
  if (sanitized.startsWith("products/")) {
    sanitized = sanitized.slice("products/".length);
  }

  if (!sanitized) return DEFAULT_PLACEHOLDER;

  // تركيب رابط Supabase المباشر النظيف والآمن 100%
  return `${SUPABASE_STORAGE_URL}${sanitized}`;
}
