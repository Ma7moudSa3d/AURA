"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

export interface ProductCardProps {
  product?: any;
  p?: any;
}

// Universal image extractor that resolves any DB structure or string format
function getImageUrl(prod: any): string | null {
  if (!prod) return null;

  function cleanUrl(val: any): string | null {
    if (!val) return null;

    if (typeof val === "object") {
      val = val.image_url || val.url || val.publicUrl || val.src || val.path || val.link;
    }

    if (typeof val !== "string") return null;

    let s = val.trim();
    if (!s) return null;

    // Handle stringified JSON array or object
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanUrl(parsed[0]);
        }
        if (parsed && typeof parsed === "object") {
          return cleanUrl(parsed);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // Remove stray quotes
    s = s.replace(/^["']|["']$/g, "").trim();
    if (!s) return null;

    // Standard HTTP / HTTPS URLs
    if (s.startsWith("http://") || s.startsWith("https://")) {
      return s;
    }

    // Protocol relative URL //...
    if (s.startsWith("//")) {
      return `https:${s}`;
    }

    // Supabase or external host without protocol prefix
    if (s.includes("supabase.co") || s.includes("vercel.app") || s.includes("http")) {
      return `https://${s.replace(/^https?:\/\//, "")}`;
    }

    // Relative root path
    if (s.startsWith("/")) {
      return s;
    }

    // Supabase Storage fallback for relative paths
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl) {
      const cleanPath = s.replace(/^\/+/, "");
      if (cleanPath.startsWith("storage/v1/object/public/")) {
        return `${supabaseUrl.replace(/\/+$/, "")}/${cleanPath}`;
      }
      return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/products/${cleanPath}`;
    }

    return `/${s}`;
  }

  const fields = [
    prod.image_url,
    prod.image,
    prod.product_images,
    prod.images,
    prod.primary_image,
    prod.cover_image,
    prod.img,
  ];

  for (const field of fields) {
    if (!field) continue;

    if (Array.isArray(field) && field.length > 0) {
      for (const item of field) {
        const res = cleanUrl(item);
        if (res) return res;
      }
    } else {
      const res = cleanUrl(field);
      if (res) return res;
    }
  }

  return null;
}

export function ProductCard({ product, p: pProp }: ProductCardProps) {
  const prod = product || pProp;
  const locale = useLocale();
  const isAr = locale === "ar";

  const [imgError, setImgError] = useState(false);

  if (!prod) return null;

  const title = isAr ? prod.title_ar || prod.title_en : prod.title_en || prod.title_ar;
  const concentration = prod.concentration || "EDP";
  const imageUrl = getImageUrl(prod);

  // Parse variants if string or array
  let variants: any[] = [];
  if (prod.variants) {
    if (typeof prod.variants === "string") {
      try {
        variants = JSON.parse(prod.variants);
      } catch (e) {
        variants = [];
      }
    } else if (Array.isArray(prod.variants)) {
      variants = prod.variants;
    }
  }

  // Extract numeric volume for ascending sorting
  const parseVolumeNum = (volStr: string): number => {
    if (!volStr) return 999;
    const match = volStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  };

  // Sort variants ascending by volume number (5ML < 10ML < 30ML < 50ML < 100ML)
  const sortedVariants = [...variants].sort((a, b) => {
    return parseVolumeNum(a.volume) - parseVolumeNum(b.volume);
  });

  // Extract volume labels sorted ascendingly
  let volumeBadges: string[] = [];
  if (sortedVariants.length > 0) {
    volumeBadges = sortedVariants.map((v) => (v.volume || "").toUpperCase());
  } else if (prod.volume) {
    volumeBadges = [String(prod.volume).toUpperCase()];
  } else {
    volumeBadges = ["5ML", "30ML", "50ML", "100ML"];
  }

  // Calculate minimum starting price across variants or base product
  let minPrice = prod.price || 0;
  let originalPrice = prod.discount_price || prod.compare_at_price || null;

  if (sortedVariants.length > 0) {
    let lowestVal = Number(sortedVariants[0].price ?? 999999);
    let lowestVariant = sortedVariants[0];

    for (const v of sortedVariants) {
      const vPrice = Number(v.price ?? 999999);
      if (vPrice < lowestVal) {
        lowestVal = vPrice;
        lowestVariant = v;
      }
    }

    if (lowestVal < 999999) {
      minPrice = lowestVal;
    }
    if (lowestVariant.discount_price || lowestVariant.compare_at_price) {
      originalPrice = Number(lowestVariant.discount_price || lowestVariant.compare_at_price);
    } else {
      originalPrice = null;
    }
  }

  const slug = prod.slug || prod.id;

  return (
    <div className="group relative bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-[#C5A059]/60 transition-all duration-300 flex flex-col h-full shadow-lg">
      <Link href={`/product/${slug}`} className="flex flex-col h-full">
        {/* Fixed Aspect Ratio Image Container */}
        <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden shrink-0">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={title || "AURA Perfume"}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600 font-serif text-2xl tracking-widest">
              AURA
            </div>
          )}
          {prod.is_featured && (
            <span className="absolute top-3 left-3 bg-[#C5A059] text-neutral-950 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shadow">
              {isAr ? "مميز" : "Featured"}
            </span>
          )}
        </div>

        {/* Card Body - Equalized Heights */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            {/* Ascending Volumes with Matching Gold Theme Color */}
            <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1.5 truncate">
              {concentration} • {volumeBadges.join(" · ")}
            </div>

            {/* Title with Fixed 2-Line Height Clamp */}
            <h3 className="font-serif text-sm font-semibold text-neutral-100 group-hover:text-[#D4AF37] transition-colors line-clamp-2 min-h-[2.5rem] leading-tight">
              {title}
            </h3>
          </div>

          {/* Locked Bottom Pricing Row */}
          <div className="flex items-baseline gap-2 pt-2 border-t border-neutral-800/50 mt-auto">
            <span className="text-xs text-neutral-400 font-light">
              {isAr ? "من" : "From"}
            </span>
            <span className="text-sm font-bold text-[#D4AF37] font-mono">
              {minPrice} EGP
            </span>
            {originalPrice && originalPrice > minPrice && (
              <span className="text-xs text-neutral-500 line-through font-mono">
                {originalPrice} EGP
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
