// شعار ذهبي فاخر احتياطي (Data URI) لا يحتاج لطلب شبكة ولا يسبب أي 404 أو أخطاء
export const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="100%" height="100%" fill="%230A0A0A"/><rect x="15" y="10" width="570" height="780" fill="none" stroke="%23C5A059" stroke-width="1" stroke-opacity="0.3"/><text x="50%" y="47%" dominant-baseline="middle" text-anchor="middle" fill="%23C5A059" font-family="serif" font-size="28" letter-spacing="8">A U R A</text><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="%23888888" font-family="sans-serif" font-size="12" letter-spacing="4">EAU DE PARFUM</text></svg>`;

export function getProductImageUrl(product: any): string {
  if (!product) return SVG_PLACEHOLDER;

  let rawPath = "";

  // 1. فحص جدول product_images المرفق
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const firstImg = product.product_images[0];
    if (typeof firstImg === "string") {
      rawPath = firstImg;
    } else if (typeof firstImg === "object" && firstImg !== null) {
      rawPath = firstImg.path || firstImg.image_url || firstImg.url || "";
    }
  }

  // 2. فحص الخانات المباشرة في جدول products
  if (!rawPath) {
    rawPath = product.image_url || product.image || "";
  }

  if (!rawPath || typeof rawPath !== "string") {
    return SVG_PLACEHOLDER;
  }

  const trimmed = rawPath.trim();
  if (!trimmed) return SVG_PLACEHOLDER;

  // إذا كان الرابط كاملاً بالكامل
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // تنظيف السلاش والبكس المكرر
  let clean = trimmed.replace(/^\/+/, "");
  if (clean.startsWith("products/")) {
    clean = clean.slice("products/".length);
  }

  if (!clean) return SVG_PLACEHOLDER;

  // تحويل الـ UUID أو اسم الملف إلى رابط Supabase المباشر والرسمي
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadqzg.supabase.co").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/products/${clean}`;
}
