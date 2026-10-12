import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSettings, getUser } from "@/lib/data";
import { desc, effectivePrice, imageUrl, money, title } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import ProductGallery from "@/components/ProductGallery";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReviewForm from "@/components/ReviewForm";
import type { Product } from "@/lib/types";

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
  const p = data as Product;

  const [settings, user, { data: reviews }] = await Promise.all([
    getSettings(),
    getUser(),
    sb.from("reviews").select("id, rating, body, created_at").eq("product_id", p.id).eq("is_approved", true).order("created_at", { ascending: false }),
  ]);

  // التحقق من شراء واستلام العميل للمنتج
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

  const price = effectivePrice(p);
  const sale = price < Number(p.price);
  const imgs = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => imageUrl(i.path));
  const notes = Array.isArray(p.product_notes) ? p.product_notes[0] : p.product_notes;
  const pyramid: [string, string[] | undefined][] = [[t("top"), notes?.top_notes], [t("heart"), notes?.heart_notes], [t("base"), notes?.base_notes]];

  return (
    <div className="container-x grid gap-10 py-12 md:grid-cols-2 md:gap-16">
      <ProductGallery images={imgs} alt={title(p, locale)} />
      <div>
        <p className="text-xs uppercase tracking-[.4em] text-gold">{p.collection} · {p.concentration} · {p.volume}</p>
        <h1 className="h-display mt-3 text-5xl">{title(p, locale)}</h1>
        <p className="mt-5 text-2xl">
          <span className="text-gold">{money(price, locale)} {c("currency")}</span>
          {sale && <span className="ms-3 text-base text-cream/40 line-through">{money(Number(p.price), locale)}</span>}
        </p>
        {p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold && <p className="mt-2 text-sm text-gold2">{t("lowStock", { n: p.stock_qty })}</p>}
        <p className="mt-6 leading-relaxed text-cream/75">{desc(p, locale)}</p>
        <div className="mt-8 space-y-3">
          <AddToCart product_id={p.id} slug={p.slug} title={title(p, locale)} image={imgs[0] ?? null} price={price} stock={p.stock_qty} />
          <WhatsAppButton number={settings.whatsapp_number} message={t("waMsg", { name: title(p, locale) })} label={n("whatsapp")} className="btn-ghost w-full" />
        </div>

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
          {(reviews ?? []).map((r) => (
            <div key={r.id} className="border-b border-white/5 py-3">
              <p className="text-gold">{"★".repeat(r.rating)}</p>
              <p className="text-sm text-cream/75">{r.body}</p>
            </div>
          ))}

          {/* استدعاء نموذج التقييم مع شروط الحساب والشراء */}
          <ReviewForm productId={p.id} loggedIn={!!user} canReview={canReview} />
        </div>
      </div>
    </div>
  );
}
