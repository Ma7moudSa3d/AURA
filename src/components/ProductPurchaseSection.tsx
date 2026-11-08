"use client";

import React, { useState } from "react";
import { useCart, useCartStore } from "@/lib/cart";
import { DEFAULT_VOLUME, resolveVariants } from "@/lib/variants";
import { getAllImageUrls, DEFAULT_PLACEHOLDER } from "@/lib/image-utils";

export interface ProductPurchaseSectionProps {
  product: any;
  locale?: string;
  whatsapp?: string;
}

const ProductPurchaseSection: React.FC<ProductPurchaseSectionProps> = ({ product, whatsapp }) => {
  const { addItem } = useCart();

  const p = product ?? {};
  const title = p.title_en || p.title_ar || p.name || "AURA Fragrance";
  const description = p.description_en || p.description_ar || p.description || "";
  const gallery = getAllImageUrls(p);
  const [activeImg, setActiveImg] = useState(0);
  const mainImageUrl = gallery[activeImg] ?? gallery[0] ?? DEFAULT_PLACEHOLDER;

  // Same pricing rule the server uses in createOrder (src/lib/variants.ts).
  const variants = resolveVariants(p).map((v) => ({ ...v, id: v.volume.toLowerCase() }));

  const [selectedVariant, setSelectedVariant] = useState(variants.find((v) => v.volume === DEFAULT_VOLUME) ?? variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem({
      id: `${p.id}-${selectedVariant.volume}`,
      product_id: p.id,
      variant_id: selectedVariant.id,
      name: title,
      price: Number(selectedVariant.price),
      volume: selectedVariant.volume,
      image_url: mainImageUrl,
      quantity: quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    useCartStore.getState().setOpen(true);
  };

  const waNumber = String(whatsapp ?? "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hello AURA Fragrances, I would like to order:\n*Product:* ${title}\n*Size:* ${selectedVariant.volume}\n*Price:* ${selectedVariant.price} EGP`
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
      {/* صورة العطر الرئيسية */}
      <div className="relative w-full aspect-[3/4] max-h-[600px] bg-surface rounded-lg overflow-hidden border border-white/10">
        <img
          src={mainImageUrl}
          alt={title}
          className="h-full w-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_PLACEHOLDER;
          }}
        />
        {gallery.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2">
            {gallery.map((g, i) => (
              <button key={g} type="button" onClick={() => setActiveImg(i)} aria-label={`Image ${i + 1}`}
                className={`h-12 w-10 overflow-hidden rounded-sm border ${i === activeImg ? "border-gold" : "border-white/20 opacity-70"}`}>
                <img src={g} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {product.is_featured && (
          <div className="absolute top-4 left-4 bg-gold text-ink text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-widest shadow-xl">
            Featured
          </div>
        )}
      </div>

      {/* تفاصيل المنتج والخيارات */}
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-cream uppercase tracking-wider mb-2">
            {title}
          </h1>
          <p className="text-2xl font-bold text-gold">
            {selectedVariant.price} EGP
          </p>
        </div>

        {/* خيارات الأحجام */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-cream/60 mb-3">
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
                      ? "border-gold bg-gold/10 text-cream shadow-lg"
                      : "border-white/10 bg-surface/50 text-cream/60 hover:border-white/15 hover:text-cream"
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{v.volume}</div>
                  <div className="text-[10px] text-gold mt-1">{v.price} EGP</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* وصف العطر */}
        {description && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-cream/70 leading-relaxed font-light">
              {description}
            </p>
          </div>
        )}

        {/* أزرار السلة والواتساب */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <span className="text-xs uppercase tracking-widest text-cream/60">Quantity:</span>
            <div className="flex items-center border border-white/10 bg-surface rounded-sm">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 text-cream/60 hover:text-cream text-sm font-bold"
              >
                -
              </button>
              <span className="px-4 py-1 text-xs text-cream font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 text-cream/60 hover:text-cream text-sm font-bold"
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
                ? "bg-gold2 text-ink"
                : "bg-gold text-ink hover:brightness-110"
            }`}
          >
            {added ? "ADDED TO BAG ✓" : `ADD TO BAG (${selectedVariant.volume})`}
          </button>

          {waNumber && (
          <a
            href={`https://wa.me/${waNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 bg-transparent border border-white/10 text-cream/70 hover:border-gold hover:text-gold font-medium text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 rounded-sm"
          >
            💬 Chat on WhatsApp
          </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPurchaseSection;
