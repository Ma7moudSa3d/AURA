import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { getCampaign } from "@/lib/campaign";
import { getCleanImageUrl } from "@/lib/image-utils";
import { pickVariant } from "@/lib/variants";
import { POCKET_PACK_VOLUME } from "@/lib/offers";
import PocketPackPicker from "@/components/PocketPackPicker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pocket Pack" };

export default async function PocketPackPage() {
  const settings: any = await getSettings();
  if (!getCampaign(settings)) notFound();
  const { data } = await supabaseService().from("products").select("*, product_images(*)").eq("is_active", true).order("title_en");
  const options = (data ?? []).map((p: any) => ({
    id: p.id,
    title_en: p.title_en,
    title_ar: p.title_ar ?? null,
    price: pickVariant(p, POCKET_PACK_VOLUME).price,
    image: getCleanImageUrl(p),
    inStock: Number(p.stock_qty) > 0,
  }));
  return (
    <div className="container-x py-12">
      <PocketPackPicker options={options} image={settings?.offer_image_pack || "/offers/pocket-pack.jpg"} />
    </div>
  );
}
