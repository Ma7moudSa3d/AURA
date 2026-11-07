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

  const title = product.title_en || product.title_ar || product.name || "AURA Fragrance";
  const description = product.description_en || product.description_ar || product.description || "";
  const basePrice = Number(product.discount_price || product.price || 550);

  // استخراج رابط الصورة الصحيح
  const getImageUrl = (prod: any) => {
    let path = "";
    if (Array.isArray(prod.product_images) && prod.product_images.length > 0) {
      const firstImg = prod.product_images[0];
      path = typeof firstImg === "string" ? firstImg : (firstImg.path || firstImg.image_url || firstImg.url || "");
    }
    if (!path) {
      path = prod.image_url || prod.image || prod.id || "";
    }
    if (!path) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";

    const pathStr = String(path).trim();
    if (pathStr.startsWith("http://") || pathStr.startsWith("https://")) {
      return pathStr;
    }
    const cleanPath = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }
    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const mainImageUrl = getImageUrl(product);

  // الأحجام المتاحة بأسعار تصاعدية
  const defaultVariants = [
    { id: "5ml", volume: "5ML", price: Math.round(basePrice * 0.2) || 80 },
    { id: "30ml", volume: "30ML", price: Math.round(basePrice * 0.65) || 350 },
    { id: "50ml", volume: "50ML", price: basePrice },
    { id: "100ml", volume: "100ML", price: Math.round(basePrice * 1.55) || 850 },
  ];

  const variants = Array.isArray(product.variants) && product.variants.length > 0
    ? [...product.variants].sort((a, b) => (parseInt(a.volume) || 0) - (parseInt(b.volume) || 0))
    : defaultVariants;

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
    `Hello AURA Fragrances, I would like to order:\n*Product:* ${title}\n*Size:* ${selectedVariant.volume}\n*Price:* ${selectedVariant.price} EGP`
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
      {/* صورة العطر في صفحة التفاصيل */}
      <div className="relative w-full aspect-[3/4] max-h-[600px] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
        <Image
          src={mainImageUrl}
          alt={title}
          fill
          unoptimized
          priority
          className="object-cover object-center"
          onError={(e: any) => {
            e.target.srcset = "";
            e.target.src = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
          }}
        />
        {product.is_featured && (
          <div className="absolute top-4 left-4 bg-[#C5A059] text-black text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-widest shadow-xl">
            Featured
          </div>
        )}
      </div>

      {/* تفاصيل العطر واختيار الحجم والطلب */}
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

        {/* زر السلة والواتساب */}
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
