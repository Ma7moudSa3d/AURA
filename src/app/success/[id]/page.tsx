import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import WhatsAppButton from "@/components/WhatsAppButton";

export default async function Success({ params }: { params: { id: string } }) {
  const t = await getTranslations("success");
  const n = await getTranslations("nav");
  const { data: o } = await supabaseServer().from("orders").select("id").eq("id", params.id).single(); // RLS: own orders only
  if (!o) notFound();
  const s = await getSettings();
  return (
    <div className="container-x max-w-xl py-24 text-center">
      <p className="text-5xl text-gold">✦</p>
      <h1 className="h-display mt-4 text-5xl">{t("title")}</h1>
      <p className="mt-6 text-xs uppercase tracking-widest text-cream/50">{t("orderId")}</p>
      <p dir="ltr" className="mt-1 break-all font-mono text-gold">{o.id}</p>
      <p className="mt-6 inline-block border border-gold2/50 px-4 py-2 text-sm uppercase tracking-widest text-gold">{t("pending")}</p>
      <p className="mt-6 text-cream/70">{t("msg")}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/track?id=${o.id}`} className="btn-gold">{t("track")}</Link>
        <WhatsAppButton number={s.whatsapp_number} message={`AURA order ${o.id}`} label={n("whatsapp")} />
      </div>
    </div>
  );
}
