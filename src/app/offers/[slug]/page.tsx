import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { getCampaign } from "@/lib/campaign";
import { getCleanImageUrl } from "@/lib/image-utils";
import { pickVariant } from "@/lib/variants";
import OfferBuilder, { type BuilderProduct } from "@/components/OfferBuilder";

export const dynamic = "force-dynamic";

const OFFERS = {
  "2x100-get-50-free": {
    type: "BUNDLE_2X100_FREE50" as const,
    titleEn: "2 × 100ML + a 50ML free", titleAr: "2 × 100ML + 50ML هدية",
    groups: [
      { key: "big", volume: "100ML", count: 2, titleEn: "Choose two 100ML bottles (same or different scents)", titleAr: "اختر زجاجتين 100ML (نفس الرائحة أو مختلفة)" },
      { key: "free", volume: "50ML", count: 1, titleEn: "Choose your free 50ML bottle (any scent)", titleAr: "اختر زجاجة الـ 50ML المجانية (أي رائحة)" },
    ],
  },
  "3x50-third-half": {
    type: "BUNDLE_2X50_THIRD_HALF" as const,
    titleEn: "3 × 50ML, the third at half price", titleAr: "3 × 50ML، الثالثة بنصف السعر",
    groups: [
      { key: "trio", volume: "50ML", count: 3, titleEn: "Choose three 50ML bottles (same or different scents)", titleAr: "اختر 3 زجاجات 50ML (نفس الرائحة أو مختلفة)" },
    ],
  },
};

export default async function OfferPage({ params }: { params: { slug: string } }) {
  const offer = (OFFERS as any)[params.slug] as (typeof OFFERS)[keyof typeof OFFERS] | undefined;
  if (!offer || !getCampaign(await getSettings())) notFound();

  const sb = supabaseService();
  const [{ data: coupon }, { data: prods }] = await Promise.all([
    sb.from("coupons").select("code,expires_at").eq("type", offer.type).eq("is_active", true).maybeSingle(),
    sb.from("products").select("*, product_images(*)").eq("is_active", true).gt("stock_qty", 0).order("title_en"),
  ]);
  if (!coupon || (coupon.expires_at && new Date(coupon.expires_at) < new Date())) notFound();

  const products: BuilderProduct[] = (prods ?? []).map((p: any) => ({
    id: p.id,
    title_en: p.title_en,
    title_ar: p.title_ar ?? null,
    image: getCleanImageUrl(p),
    stock: Number(p.stock_qty),
    prices: Object.fromEntries(offer.groups.map((g) => [g.volume, pickVariant(p, g.volume).price])),
  }));

  return (
    <div className="container-x py-12">
      <OfferBuilder type={offer.type} code={coupon.code} titleEn={offer.titleEn} titleAr={offer.titleAr} groups={offer.groups} products={products} />
    </div>
  );
}
