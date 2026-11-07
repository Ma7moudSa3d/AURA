"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";

interface ProductCardProps {
  product: any;
  locale: string;
}

const ProductCard = ({ product, locale }: ProductCardProps) => {
  const { addItem } = useCart();

  // تنظيف ومعالجة رابط الصورة
  const getImageUrl = (imagePath: any) => {
    if (!imagePath) return "/placeholder.jpg";
    
    // إذا كان المسار عبارة عن مصفوفة، نأخذ أول عنصر
    const path = Array.isArray(imagePath) ? imagePath[0] : imagePath;
    
    // إذا كان الرابط يبدأ بـ http فهو رابط كامل لا نعدل عليه
    if (path.startsWith("http")) return path;

    // تنظيف المسار من أي سلاش زائد في البداية
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    
    // الرابط الرسمي لـ Supabase الخاص بك
    // تأكد أن Bucket Name هو 'products' وأن المجلد بالداخل متوافق
    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  // ترتيب الأحجام تصاعدياً
  const sortedVariants = product.variants 
    ? [...product.variants].sort((a, b) => (parseInt(a.volume) || 0) - (parseInt(b.volume) || 0))
    : [];

  const minPrice = sortedVariants.length > 0 
    ? Math.min(...sortedVariants.map(v => v.price)) 
    : 0;

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* Product Image */}
      <Link href={`/product/${product.id}`} className="relative h-80 w-full overflow-hidden bg-zinc-900">
        <Image
          src={getImageUrl(product.image_url)}
          alt={product.name}
          fill
          unoptimized // لضمان ظهور الصور مباشرة دون معالجة من Vercel قد تعطلها
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e: any) => {
            e.target.src = "https://placehold.co/400x600/0a0a0a/C5A059?text=AURA+Fragrance";
          }}
        />
        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Sizes Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sortedVariants.map((v: any) => (
            <span key={v.id} className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full">
              {v.volume}
            </span>
          ))}
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
            if (firstVariant) {
              addItem({
                id: `${product.id}-${firstVariant.id}`,
                product_id: product.id,
                variant_id: firstVariant.id,
                name: product.name,
                price: firstVariant.price,
                volume: firstVariant.volume,
                image_url: getImageUrl(product.image_url),
                quantity: 1
              });
            }
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
