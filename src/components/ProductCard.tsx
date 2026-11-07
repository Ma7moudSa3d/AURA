"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export interface ProductCardProps {
  product?: any;
  p?: any;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const item = props.product || props.p;
  const { addItem } = useCart();

  if (!item) return null;

  // 1. الاسم من title_en
  const name = item.title_en || item.name || "AURA Fragrance";
  
  // 2. السعر (الخصم أولاً)
  const price = Number(item.discount_price || item.price || 0);

  // 3. رابط الصورة (الرجوع للرابط المباشر اللي كان شغال)
  const getImageUrl = (prod: any) => {
    // لو فيه رابط كامل مخزن استخدمه فوراً
    if (prod.image_url && String(prod.image_url).startsWith('http')) return prod.image_url;
    
    // لو المسار عبارة عن UUID أو اسم ملف
    let path = prod.image_url || "";
    if (!path && prod.product_images?.length > 0) {
      path = prod.product_images[0].path || prod.product_images[0].image_url;
    }
    
    if (!path) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA";

    const cleanPath = String(path).trim().replace(/^\//, '');
    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const imageUrl = getImageUrl(item);
  const volumes = ["5ML", "30ML", "50ML", "100ML"];

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      <Link href={`/product/${item.id}`} className="relative block h-80 w-full shrink-0 overflow-hidden bg-zinc-900">
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
          {volumes.map((vol) => (
            <span key={vol} className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full">
              {vol}
            </span>
          ))}
        </div>

        <Link href={`/product/${item.id}`}>
          <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#C5A059] transition-colors line-clamp-2 min-h-[2.5rem] uppercase tracking-wider">
            {name}
          </h3>
        </Link>
        
        <p className="text-[#D4AF37] font-bold text-sm mt-auto pt-2">
          <span className="text-zinc-500 text-[10px] font-normal mr-1 uppercase tracking-tighter">From</span>
          {price} EGP
        </p>

        <button
          onClick={() => addItem({ id: `${item.id}-50ml`, name, price, volume: "50ML", image_url: imageUrl, quantity: 1 })}
          className="mt-4 w-full py-2 bg-transparent border border-[#C5A059] text-[#C5A059] text-xs font-bold rounded-sm hover:bg-[#C5A059] hover:text-black transition-all duration-300 uppercase tracking-widest"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
