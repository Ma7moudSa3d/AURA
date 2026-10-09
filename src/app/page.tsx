import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import type { Product } from "@/lib/types";

export default async function Home() {
  const t = await getTranslations("home");
  const { data } = await supabaseServer().from("products").select("*, product_images(id, path, sort_order)")
    .eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(4);
  const products = (data ?? []) as Product[];
  return (
    <>
      <section className="relative grid min-h-[80vh] place-items-center overflow-hidden px-5 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(214,178,94,.14),transparent_55%)]" />
        <Reveal className="relative max-w-3xl">
          <p className="mb-6 text-xs uppercase tracking-[.5em] text-gold">{t("eyebrow")}</p>
          <h1 className="h-display text-5xl leading-tight sm:text-7xl">{t("title")}</h1>
          <p className="mx-auto mt-6 max-w-xl text-cream/70">{t("subtitle")}</p>
          <Link href="/shop" className="btn-gold mt-10">{t("cta")}</Link>
        </Reveal>
      </section>

      {products.length > 0 && (
        <section className="container-x py-16">
          <Reveal><h2 className="h-display mb-10 text-center text-4xl">{t("featured")}</h2></Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {products.map((p, i) => <Reveal key={p.id} delay={i * 0.08}><ProductCard p={p} /></Reveal>)}
          </div>
        </section>
      )}

      <section className="container-x grid gap-6 py-10 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Reveal key={n} delay={n * 0.08} className="card p-8 text-center">
            <h3 className="h-display text-2xl text-gold">{t(`promise${n}` as "promise1")}</h3>
            <p className="mt-2 text-sm text-cream/60">{t(`promise${n}d` as "promise1d")}</p>
          </Reveal>
        ))}
      </section>
    </>
  );
}
