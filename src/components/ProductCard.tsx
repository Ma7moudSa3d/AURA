// src/components/ProductCard.tsx
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { imageUrl, money, title } from "@/lib/format"

export default async function ProductCard({ product }: { product: any }) {
  const locale = await getLocale()
  const c = await getTranslations("common")

  const p = product
  const rawImages = p?.product_images ?? p?.images ?? []
  const mainImage = rawImages.length > 0 ? imageUrl(rawImages[0].path) : "/placeholder.jpg"

  // قراءة مصفوفة السعات إن وجدت
  let variants: any[] = []
  if (Array.isArray(p?.variants)) {
    variants = p.variants
  } else if (typeof p?.variants === "string") {
    try {
      variants = JSON.parse(p.variants)
    } catch (e) {
      variants = []
    }
  }

  // عرض السعات المتوفرة
  let volumeText = p?.volume || "50ml"
  if (variants.length > 1) {
    const vols = variants.map((v: any) => v.volume).filter(Boolean)
    if (vols.length > 0) {
      volumeText = vols.join(" · ")
    }
  }

  // حساب أقل سعر متوفر
  let minPrice = Number(p?.price || 0)
  let minDiscountPrice: number | null = p?.discount_price ? Number(p.discount_price) : null

  if (variants.length > 0) {
    const prices = variants.map((v: any) => {
      const dp = v.discount_price ? Number(v.discount_price) : null
      const pr = Number(v.price || 0)
      return dp && dp > 0 ? dp : pr
    })
    minPrice = Math.min(...prices)
  }

  const effectiveP = minDiscountPrice && minDiscountPrice > 0 ? minDiscountPrice : minPrice
  const hasDiscount = p?.discount_price && Number(p.discount_price) < Number(p.price)

  return (
    <div className="group relative flex flex-col justify-between border border-white/5 bg-surface/50 p-4 transition-all hover:border-gold/30 rounded-sm">
      <div>
        <Link href={`/product/${p.slug}`} className="block overflow-hidden">
          <div className="aspect-square w-full overflow-hidden bg-ink">
            <img
              src={mainImage}
              alt={title(p, locale)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">
            {p?.concentration || "EDP"} · {volumeText}
          </p>
          <Link href={`/product/${p.slug}`}>
            <h3 className="h-display mt-1 text-lg font-serif text-cream hover:text-gold transition">
              {title(p, locale)}
            </h3>
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div>
          <span className="text-sm font-bold text-gold">
            {variants.length > 1 ? (locale === "ar" ? "من " : "From ") : ""}
            {money(effectiveP, locale)} {c("currency")}
          </span>
          {hasDiscount && (
            <span className="ms-2 text-xs text-cream/40 line-through">
              {money(Number(p.price), locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
