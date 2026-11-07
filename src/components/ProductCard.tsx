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

  // حل وتحديد رابط الصورة المباشر من Supabase
  const getImageUrl = (imgData: any) => {
    if (!imgData) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
    
    let path = imgData;
    if (Array.isArray(imgData)) path = imgData[0];
    if (typeof path === "object" && path !== null) path = path.url || path.path || "";
    if (typeof path !== "string" || !path.trim()) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";

    path = path.trim();

    // رابط كامل
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    
    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }

    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  // ترتيب أحجام العطور تصاعدياً (5ML < 30ML < 50ML < 100ML)
  const sortedVariants = product.variants && Array.isArray(product.variants)
    ? [...product.variants].sort((a, b) => (parseInt(a.volume) || 0) - (parseInt(b.volume) || 0))
    : [];

  const minPrice = sortedVariants.length > 0 
    ? Math.min(...sortedVariants.map((v: any) => Number(v.price) || 0)) 
    : (Number(product.price) || 0);

  const imageUrl = getImageUrl(product.image_url || product.image || product.images);

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* صورة العطر */}
      <Link href={`/product/${product.id}`} className="relative h-80 w-full overflow-hidden bg-zinc-900 block">
        <Image
          src={imageUrl}
          alt={product.name || "AURA Fragrance"}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
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

      {/* التفاصيل */}
      <div className="p-4 flex flex-col flex-grow">
        {/* الأحجام */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sortedVariants.length > 0 ? (
            sortedVariants.map((v: any, index: number) => (
              <span key={v.id || index} className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full">
                {v.volume}
              </span>
            ))
          ) : (
            <span className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full">
              50ML
            </span>
          )}
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#C5A059] transition-colors line-clamp-2 min-h-[2.5rem] uppercase tracking-wider">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-[#D4AF37] font-bold text-sm mt-auto">
          <span className="text-zinc-500 text-[10px] font-normal mr-1 uppercase tracking-tighter">From</span>
          {minPrice} EGP
        </p>

        <button
          onClick={() => {
            const firstVariant = sortedVariants[0];
            addItem({
              id: `${product.id}-${firstVariant?.id || 'default'}`,
              product_id: product.id,
              variant_id: firstVariant?.id,
              name: product.name,
              price: firstVariant ? Number(firstVariant.price) : minPrice,
              volume: firstVariant ? firstVariant.volume : "50ML",
              image_url: imageUrl,
              quantity: 1
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
