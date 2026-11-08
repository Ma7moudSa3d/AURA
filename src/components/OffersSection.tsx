import { supabaseService } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { getCampaign } from "@/lib/campaign";
import { POCKET_PACK_PRICE, POCKET_PACK_VOLUME } from "@/lib/offers";
import { pickVariant } from "@/lib/variants";
import { OfferCard, PocketPackCard } from "@/components/OfferCards";

/** The three Golden Friday offers. Shown only while the campaign is live; coupon offers only while their coupon is active. */
export default async function OffersSection({ contained = false }: { contained?: boolean }) {
  const settings: any = await getSettings();
  if (!getCampaign(settings)) return null;
  const sb = supabaseService();
  const [{ data: coupons }, { data: products }] = await Promise.all([
    sb.from("coupons").select("code,type,expires_at").eq("is_active", true).in("type", ["BUNDLE_2X100_FREE50", "BUNDLE_2X50_THIRD_HALF"]),
    sb.from("products").select("*").eq("is_active", true),
  ]);
  const live = (coupons ?? []).filter((c) => !c.expires_at || new Date(c.expires_at) > new Date());
  const a = live.find((c) => c.type === "BUNDLE_2X100_FREE50");
  const b = live.find((c) => c.type === "BUNDLE_2X50_THIRD_HALF");
  const worth = (products ?? []).length >= 7
    ? (products ?? []).map((p) => pickVariant(p, POCKET_PACK_VOLUME).price).sort((x, y) => x - y).slice(-7).reduce((s, x) => s + x, 0)
    : 0;
  const packOk = (products ?? []).filter((p) => Number(p.stock_qty) > 0).length >= 7;

  if (!a && !b && !packOk) return null;
  return (
    <section className={contained ? "mb-10" : "container-x py-12"}>
      <div className="grid gap-6 md:grid-cols-3">
        {a && (
          <OfferCard href="/offers/2x100-get-50-free" art={settings?.offer_image_100} tileBig="2 + 1" tileSmall="100ML · 100ML · 50ML FREE" code={a.code}
            titleEn="2 × 100ML + 50ML free" titleAr="2 × 100مل + 50مل هدية"
            bodyEn="Buy any two 100ML bottles and the 50ML bottle in your cart is on us."
            bodyAr="اشتري أي زجاجتين 100 مل وزجاجة 50 مل في سلتك علينا." />
        )}
        {b && (
          <OfferCard href="/offers/3x50-third-half" art={settings?.offer_image_50} tileBig="3rd −50%" tileSmall="3 × 50ML" code={b.code}
            titleEn="3 × 50ML, third at half price" titleAr="3 × 50مل، الثالثة بنصف السعر"
            bodyEn="Pick three 50ML bottles and get 50% off the third one."
            bodyAr="اختر 3 زجاجات 50 مل واحصل على خصم 50% على الثالثة." />
        )}
        {packOk && <PocketPackCard price={POCKET_PACK_PRICE} worth={worth} image={settings?.offer_image_pack || "/offers/pocket-pack.jpg"} />}
      </div>
    </section>
  );
}
