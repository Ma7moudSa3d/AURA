"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export interface ProductCardProps {
  product?: any;
  p?: any;
  locale?: string;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const product = props.product || props.p;
  const { addItem } = useCart();

  if (!product) return null;

  // استخدام الـ slug كأولوية في الروابط ليكون الرابط نظيفاً ومطابقاً لـ Supabase
  const productLink = `/product/${product.slug || product.id}`;

  // الاسم الحقيقي
  const name =
    product.title_en ||
    product.title_ar ||
    product.name ||
    "AURA Fragrance";

  // السعر الأصلي أو المخصم
  const price = Number(product.discount_price || product.price || 0);

  // استخراج الصورة من product_images أو image_url
  let rawImage: any = null;

  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const firstImage = product.product_images[0];
    rawImage =
      firstImage?.image_url ||
      firstImage?.url ||
      firstImage?.path ||
      firstImage;
  } else {
    rawImage = product.image_url || product.image || null;
  }

  const getImageUrl = (img: any) => {
    if (!img) {
      return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
    }

    if (Array.isArray(img)) img = img[0];

    if (typeof img === "object" && img !== null) {
      img = img.image_url || img.url || img.path || "";
    }

    if (typeof img !== "string" || !img.trim()) {
      return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
    }

    const path = img.trim();

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }

    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const imageUrl = getImageUrl(rawImage);
  const volumes = ["5ML", "30ML", "50ML", "100ML"];

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* الصورة بأبعاد متساوية */}
      <Link
        href={productLink}
        className="relative block h-80 w-full shrink-0 overflow-hidden bg-zinc-900"
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e: any) => {
            e.target.srcset = "";
            e.target.src = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
          }}
        />

        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}
      </Link>

      {/* المحتوى مع محاذاة الكروت بنفس الطول exact height */}
      <div className="p-4 flex flex-col flex-grow">
        {/* الأحجام مرتبة تصاعدياً */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
          {volumes.map((vol) => (
            <span
              key={vol}
              className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full"
            >
              {vol}
            </span>
          ))}
        </div>

        {/* اسم العطر مع توحيد ارتفاع العنوان */}
        <Link href={productLink}>
          <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#C5A059] transition-colors line-clamp-2 min-h-[2.5rem] uppercase tracking-wider">
            {name}
          </h3>
        </Link>

        {/* السعر الـ الذهبي */}
        <p className="text-[#D4AF37] font-bold text-sm mt-auto pt-2">
          <span className="text-zinc-500 text-[10px] font-normal mr-1 uppercase tracking-tighter">
            From
          </span>
          {price} EGP
        </p>

        {/* زر الإضافة للسلة */}
        <button
          type="button"
          onClick={() => {
            addItem({
              id: `${product.id}-50ml`,
              product_id: product.id,
              variant_id: null,
              name,
              price,
              volume: product.volume || "50ML",
              image_url: imageUrl,
              quantity: 1,
            });
          }}
          className="mt-4 w-full py-2 bg-transparent border border-[#C5A059] text-[#C5A059] text-xs font-bold rounded-sm hover:bg-[#C5A059] hover:text-black transition-all duration-300 uppercase tracking-widest"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
