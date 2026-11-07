"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart";

export interface ProductPurchaseSectionProps {
  product: any;
  locale?: string;
}

const ProductPurchaseSection: React.FC<ProductPurchaseSectionProps> = ({ product }) => {
  const { addItem } = useCart();

  if (!product) return null;

  const title = product.name || product.title_en || product.title_ar || "AURA Fragrance";
  const description = product.description || product.description_en || product.description_ar || "";

  // جلب رابط الصورة
  const resolveImageUrl = (prod: any) => {
    let raw = prod.image_url || prod.image;
    if (!raw && Array.isArray(prod.product_images) && prod.product_images.length > 0) {
      const first = prod.product_images[0];
      raw = typeof first === "string" ? first : (first?.path || first?.image_url || first?.url);
    }
    if (!raw && prod.id) {
      raw = prod.id;
    }
    if (!raw) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";

    const path = String(raw).trim();
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }
    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const mainImageUrl = resolveImageUrl(product);

  // الأحجام والأسعار مرتبة تصاعدياً
  const defaultVariants = [
    { id: "5ml", volume: "5ML", price: Math.round((Number(product.price) || 550) * 0.2) || 80 },
    { id: "30ml", volume: "30ML", price: Math.round((Number(product.price) || 550) * 0.65) || 350 },
    { id: "50ml", volume: "50ML", price: Number(product.price) || 550 },
    { id: "100ml", volume: "100ML", price: Math.round((Number(product.price) || 550) * 1.55) || 850 },
  ];

  let variants = defaultVariants;
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    variants = [...product.variants].sort((a, b) => (parseInt(a.volume) || 0) - (parseInt(b.volume) || 0));
  }

  const [selectedVariant, setSelectedVariant] = useState(variants[2] || variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${selectedVariant.volume}`,
      product_id: product.id,
      variant_id: selectedVariant.id,
      name: title,
      price: Number(selectedVariant.price),
      volume: selectedVariant.volume,
      image_url: mainImageUrl,
      quantity: quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello AURA Fragrances, I would like to inquire about ordering:\n*Product:* ${title}\n*Size:* ${selectedVariant.volume}\n*Price:* ${selectedVariant.price} EGP`
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
      {/* العمود الأيسر: صورة العطر */}
      <div className="relative w-full aspect-[3/4] max-h-[600px] bg-zinc-900/80 rounded-lg overflow-hidden border border-zinc-800 group">
        <Image
          src={mainImageUrl}
          alt={title}
          fill
          unoptimized
          priority
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          onError={(e: any) => {
            const currentSrc = e.target.src;
            if (!currentSrc.includes(".png") && !currentSrc.includes(".jpg") && !currentSrc.includes("placehold.co")) {
              e.target.src = `${mainImageUrl}.png`;
            } else if (currentSrc.includes(".png")) {
              e.target.src = `${mainImageUrl}.jpg`;
            } else {
              e.target.srcset = "";
              e.target.src = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
            }
          }}
        />
        {product.is_featured && (
          <div className="absolute top-4 left-4 bg-[#C5A059] text-black text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-widest shadow-xl">
            Featured
          </div>
        )}
      </div>

      {/* العمود الأيمن: تفاصيل العطر والطلب */}
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-white uppercase tracking-wider mb-2">
            {title}
          </h1>
          <p className="text-2xl font-bold text-[#D4AF37]">
            {selectedVariant.price} EGP
          </p>
        </div>

        {/* اختيار الحجم */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-3">
            Select Size / السعة :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariant.volume === v.volume;
              return (
                <button
                  key={v.id || v.volume}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`py-3 px-2 rounded-sm border text-center transition-all ${
                    isSelected
                      ? "border-[#C5A059] bg-[#C5A059]/10 text-white shadow-lg"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{v.volume}</div>
                  <div className="text-[10px] text-[#D4AF37] mt-1">{v.price} EGP</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* الوصف */}
        {description && (
          <div className="border-t border-zinc-800/80 pt-4">
            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {description}
            </p>
          </div>
        )}

        {/* الكمية والأزرار */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <span className="text-xs uppercase tracking-widest text-zinc-400">Quantity:</span>
            <div className="flex items-center border border-zinc-800 bg-zinc-900 rounded-sm">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 text-zinc-400 hover:text-white text-sm font-bold"
              >
                -
              </button>
              <span className="px-4 py-1 text-xs text-white font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 text-zinc-400 hover:text-white text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-3.5 px-6 font-bold uppercase tracking-widest text-xs transition-all duration-300 rounded-sm shadow-md ${
              added
                ? "bg-green-600 text-white"
                : "bg-[#C5A059] text-black hover:bg-[#D4AF37]"
            }`}
          >
            {added ? "ADDED TO BAG ✓" : `ADD TO BAG (${selectedVariant.volume})`}
          </button>

          <a
            href={`https://wa.me/201111111111?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 bg-transparent border border-zinc-800 text-zinc-300 hover:border-[#C5A059] hover:text-[#C5A059] font-medium text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 rounded-sm"
          >
            💬 Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductPurchaseSection;
