"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useCartStore } from "@/lib/cart-store";

function IconShoppingBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconWhatsApp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.396-.883-.726-1.48-1.623-1.653-1.92-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function ProductPurchaseSection({
  product,
  locale: propLocale,
  currency = "EGP",
  image,
  whatsappNumber,
  waMsg,
  waLabel,
}: any) {
  const currentLocale = useLocale();
  const isAr = (propLocale || currentLocale) === "ar";
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  // Parse variants if string or array
  let variants: any[] = [];
  if (product?.variants) {
    if (typeof product.variants === "string") {
      try {
        variants = JSON.parse(product.variants);
      } catch (e) {
        variants = [];
      }
    } else if (Array.isArray(product.variants)) {
      variants = product.variants;
    }
  }

  // Extract numeric volume value for ascending sorting (5ML < 10ML < 30ML < 50ML < 100ML)
  const parseVolumeNum = (volStr: string): number => {
    if (!volStr) return 999;
    const match = volStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  };

  // Sort variants ascending by volume size
  const sortedVariants = [...variants].sort((a, b) => {
    return parseVolumeNum(a.volume) - parseVolumeNum(b.volume);
  });

  // Fallback default variants if none exist
  const finalVariants = sortedVariants.length > 0 ? sortedVariants : [
    { volume: "5ML", price: Math.round((product?.price || 450) * 0.2), stock_qty: 50 },
    { volume: "30ML", price: Math.round((product?.price || 450) * 0.6), stock_qty: 50 },
    { volume: "50ML", price: product?.price || 450, discount_price: product?.discount_price, stock_qty: 50 },
    { volume: "100ML", price: Math.round((product?.price || 450) * 1.6), stock_qty: 50 },
  ].sort((a, b) => parseVolumeNum(a.volume) - parseVolumeNum(b.volume));

  // Default active variant: select 50ML or the first sorted variant
  const initialVariant = finalVariants.find((v) => (v.volume || "").toUpperCase().includes("50ML")) || finalVariants[0];
  const [selectedVariant, setSelectedVariant] = useState<any>(initialVariant);
  const [added, setAdded] = useState(false);

  const activePrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const activeDiscount = selectedVariant?.discount_price || selectedVariant?.compare_at_price || product?.discount_price || null;
  const activeVolume = selectedVariant?.volume || "100ML";

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${activeVolume}`,
      product_id: product.id,
      volume: activeVolume,
      price: activePrice,
      quantity: 1,
      product: {
        id: product.id,
        title_en: product.title_en,
        title_ar: product.title_ar,
        image_url: image || product.image_url || product.image,
        price: activePrice,
      },
    });

    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const rawPhone = whatsappNumber || "01016267377";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("20") ? cleanPhone : `20${cleanPhone.replace(/^0+/, "")}`;

  const defaultWaMsg = `Hello AURA Fragrances, I would like to inquire about ${product?.title_en || "Perfume"} (${activeVolume} - ${activePrice} ${currency}).`;
  const whatsappMessage = encodeURIComponent(waMsg || defaultWaMsg);

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold font-mono text-[#D4AF37]">
          {activePrice} {currency}
        </span>
        {activeDiscount && Number(activeDiscount) > activePrice && (
          <span className="text-lg text-neutral-500 line-through font-mono">
            {activeDiscount} {currency}
          </span>
        )}
      </div>

      {/* Size Selector with Sorted Volumes */}
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
          {isAr ? "اختر الحجم / SELECT SIZE:" : "SELECT SIZE / السعة:"}
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {finalVariants.map((v: any, idx: number) => {
            const vol = (v.volume || "").toUpperCase();
            const price = v.price;
            const isSelected = (selectedVariant?.volume || "").toUpperCase() === vol;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`py-3 px-3 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? "bg-[#C5A059]/20 border-[#C5A059] text-white shadow-md shadow-[#C5A059]/10"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span className="font-mono font-bold text-xs tracking-wider">
                  {vol}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {price} {currency}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      {product?.description_en && (
        <p className="text-sm text-neutral-300 leading-relaxed font-light pt-2">
          {isAr ? product.description_ar || product.description_en : product.description_en}
        </p>
      )}

      {/* Actions: Add to Cart & WhatsApp */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b39049] hover:to-[#c29e2d] text-neutral-950 font-bold uppercase tracking-widest shadow-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <IconShoppingBag className="w-5 h-5" />
          <span>
            {added
              ? isAr ? "تمت الإضافة للسلة ✓" : "ADDED TO BAG ✓"
              : isAr ? `إضافة للسلة (${activeVolume})` : `ADD TO BAG (${activeVolume})`}
          </span>
        </button>

        <a
          href={`https://wa.me/${formattedPhone}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-xl border border-neutral-800 hover:border-[#C5A059]/50 bg-neutral-950 text-neutral-300 hover:text-white font-medium text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
        >
          <IconWhatsApp className="w-4 h-4 text-emerald-500" />
          <span>{waLabel || (isAr ? "تواصل عبر الواتساب" : "CHAT ON WHATSAPP")}</span>
        </a>
      </div>
    </div>
  );
}

export default ProductPurchaseSection;
