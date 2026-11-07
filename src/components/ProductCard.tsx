"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

export interface ProductCardProps {
  product?: any;
  p?: any;
}

// Universal image extractor that resolves any DB structure
function getImageUrl(prod: any): string | null {
  if (!prod) return null;

  const candidates = [
    prod.image_url,
    prod.image,
    prod.primary_image,
    prod.cover_image,
    prod.images,
    prod.product_images,
    prod.img,
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  function parseCandidate(item: any): string | null {
    if (!item) return null;

    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) return null;

      // Check if stringified JSON
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          return parseCandidate(parsed);
        } catch (e) {
          // Ignore JSON parse error, treat as string
        }
      }

      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:") ||
        trimmed.startsWith("/")
      ) {
        return trimmed;
      }

      if (supabaseUrl) {
        return `${supabaseUrl}/storage/v1/object/public/products/${trimmed}`;
      }

      return `/${trimmed}`;
    }

    if (Array.isArray(item)) {
      for (const el of item) {
        const res = parseCandidate(el);
        if (res) return res;
      }
      return null;
    }

    if (typeof item === "object") {
      const objUrl =
        item.image_url ||
        item.url ||
        item.publicUrl ||
        item.src ||
        item.path ||
        item.link;
      if (objUrl) {
        return parseCandidate(objUrl);
      }
    }

    return null;
  }

  for (const candidate of candidates) {
    const res = parseCandidate(candidate);
    if (res) return res;
  }

  return null;
}

export function ProductCard({ product, p: pProp }: ProductCardProps) {
  const prod = product || pProp;
  const locale = useLocale();
  const isAr = locale === "ar";

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
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || "AURA Perfume"}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
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
