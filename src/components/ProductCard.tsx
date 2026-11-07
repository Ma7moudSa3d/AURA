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

  // الاسم الصح من الداتا بيز
  const name =
    product.title_en ||
    product.title_ar ||
    product.name ||
    "AURA Fragrance";

  // السعر
  const price = Number(product.discount_price || product.price || 0);

  // جلب الصورة من product_images أو image_url
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

  // تحويل الصورة لرابط صحيح
  const getImageUrl = (img: any) => {
    if (!img) {
      return "https://placehold.co/700x900/0a0a0a/C5A059?text=AURA+Fragrance";
    }

    if (Array.isArray(img)) img = img[0];

    if (typeof img === "object" && img !== null) {
      img = img.image_url || img.url || img.path || "";
    }

    if (typeof img !== "string") {
      return "https://placehold.co/700x900/0a0a0a/C5A059?text=AURA+Fragrance";
    }

    const path = img.trim();

    if (!path) {
      return "https://placehold.co/700x900/0a0a0a/C5A059?text=AURA+Fragrance";
    }

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
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-[#090909] transition-all duration-300 hover:border-[#C5A059]/45">
      {/* الصورة */}
      <Link
        href={`/product/${product.id}`}
        className="relative block h-[340px] w-full shrink-0 overflow-hidden bg-[#111111]"
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {product.is_featured && (
          <div className="absolute left-3 top-3 bg-[#C5A059] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
            Featured
          </div>
        )}
      </Link>

      {/* المحتوى */}
      <div className="flex flex-1 flex-col p-4">
        {/* الأحجام */}
        <div className="mb-3 flex min-h-[26px] flex-wrap gap-1.5">
          {volumes.map((vol) => (
            <span
              key={vol}
              className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-400"
            >
              {vol}
            </span>
          ))}
        </div>

        {/* الاسم */}
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[44px] text-[13px] font-medium uppercase leading-5 tracking-[0.14em] text-white transition-colors duration-300 group-hover:text-[#C5A059]">
            {name}
          </h3>
        </Link>

        {/* السعر */}
        <p className="mt-auto pt-4 text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">
          <span className="mr-1 text-[10px] font-normal tracking-[0.12em] text-zinc-500">
            From
          </span>
          {price} EGP
        </p>

        {/* الزرار */}
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
          className="mt-4 h-[40px] w-full border border-[#C5A059] text-[11px] font-bold uppercase tracking-[0.22em] text-[#C5A059] transition-all duration-300 hover:bg-[#C5A059] hover:text-black"
        >
          Add To Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
