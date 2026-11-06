"use client"
import { useState } from "react"
import { ProductVariant } from "@/lib/types"

interface SizeSelectorProps {
  defaultVolume: string;
  defaultPrice: number;
  defaultDiscountPrice?: number | null;
  variants?: ProductVariant[];
  onSelect: (selected: { volume: string; price: number; discount_price?: number | null }) => void;
}

export default function SizeSelector({
  defaultVolume,
  defaultPrice,
  defaultDiscountPrice,
  variants = [],
  onSelect,
}: SizeSelectorProps) {
  // تجميع كافة السعات المتاحة
  const allSizes = variants.length > 0 ? variants : [
    { volume: defaultVolume, price: defaultPrice, discount_price: defaultDiscountPrice }
  ];

  const [selectedVolume, setSelectedVolume] = useState<string>(allSizes[0].volume);

  const handleSelect = (v: ProductVariant) => {
    setSelectedVolume(v.volume);
    onSelect({
      volume: v.volume,
      price: v.price,
      discount_price: v.discount_price,
    });
  };

  return (
    <div className="space-y-3 my-4">
      <label className="block text-xs uppercase tracking-widest text-gold font-bold">
        Select Size / اختر السعة:
      </label>
      <div className="flex flex-wrap gap-3">
        {allSizes.map((item, idx) => {
          const isSelected = selectedVolume === item.volume;
          const currentPrice = item.discount_price ?? item.price;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className={`px-4 py-2 text-sm border font-sans transition-all flex flex-col items-center justify-center min-w-[90px] ${
                isSelected
                  ? "border-gold bg-gold/10 text-gold font-bold shadow-md shadow-gold/10"
                  : "border-white/10 bg-surface text-cream/70 hover:border-white/30 hover:text-white"
              }`}
            >
              <span className="uppercase text-xs tracking-wider">{item.volume}</span>
              <span className="text-xs mt-0.5 text-gold/90 font-mono">
                {currentPrice} EGP
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
