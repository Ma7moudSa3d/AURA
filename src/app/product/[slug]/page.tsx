import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSettings, getUser } from "@/lib/data";
import { imageUrl, title } from "@/lib/format";
import ProductGallery from "@/components/ProductGallery";
import ReviewForm from "@/components/ReviewForm";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabaseServer().from("products").select("title_en").eq("slug", params.slug).single();
  return { title: data?.title_en ?? "Product" };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const locale = await getLocale();
  const t = await getTranslations("product");
  const n = await getTranslations("nav");
  const c = await getTranslations("common");
  const sb = supabaseServer();
  
  const { data } = await sb
    .from("products")
    .select("*, product_images(id, path, sort_order), product_notes(*)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!data) notFound();
  const p = data as any;

  const [settings, user, { data: reviews }] = await Promise.all([
    getSettings(),
    getUser(),
    sb.from("reviews").select("id, rating, body, created_at").eq("product_id", p.id).eq("is_approved", true).order("created_at", { ascending: false }),
  ]);

  let canReview = false;
  if (user) {
    const { data: userOrders } = await sb
      .from("orders")
      .select("id, status, order_items!inner(product_id)")
      .eq("user_id", user.id)
      .ilike("status", "%delivered%")
      .eq("order_items.product_id", p.id);

    canReview = Boolean(userOrders && userOrders.length > 0);
  }

  const rawImages = p.product_images ?? p.images ?? [];
  const imgs = [...rawImages].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => imageUrl(i.path));
  const notes = Array.isArray(p.product_notes) ? p.product_notes[0] : p.product_notes;
  const pyramid: [string, string[] | undefined][] = [[t("top"), notes?.top_notes], [t("heart"), notes?.heart_notes], [t("base"), notes?.base_notes]];

  return (
    <div className="container-x grid gap-10 py-12 md:grid-cols-2 md:gap-16">
      <ProductGallery images={imgs} alt={title(p, locale)} />
      <div>
        <p className="text-xs uppercase tracking-[.4em] text-gold">{p.collection} · {p.concentration}</p>
        <h1 className="h-display mt-3 text-5xl">{title(p, locale)}</h1>
        
        <ProductPurchaseSection
          product={p}
          locale={locale}
          currency={c("currency")}
          image={imgs[0] ?? null}
          whatsappNumber={settings?.whatsapp_number}
          waMsg={t("waMsg", { name: title(p, locale) })}
          waLabel={n("whatsapp")}
        />

        {notes && (
          <div className="mt-12">
            <h2 className="h-display mb-4 text-2xl">{t("notes")}</h2>
            <div className="divide-y divide-white/5 border border-white/5 bg-surface">
              {pyramid.map(([label, arr]) => (
                <div key={label} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
                  <span className="w-32 text-xs uppercase tracking-widest text-gold">{label}</span>
                  <span className="text-cream/80">{(arr ?? []).join(" · ") || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="h-display mb-4 text-2xl">{t("reviews")}</h2>
          {(reviews ?? []).length === 0 && <p className="text-sm text-cream/50">{t("noReviews")}</p>}
          {(reviews ?? []).map((r: any) => (
            <div key={r.id} className="border-b border-white/5 py-3">
              <p className="text-gold">{"★".repeat(r.rating)}</p>
              <p className="text-sm text-cream/75">{r.body}</p>
            </div>
          ))}

          <ReviewForm productId={p.id} loggedIn={!!user} canReview={canReview} />
        </div>
      </div>
    </div>
  );
}
