import React from "react";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import { getSettings, getUser } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";
import ReviewForm from "@/components/ReviewForm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadqzg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
});

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const slugOrId = resolvedParams?.slug;

  if (!slugOrId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-cream">
        <h1 className="font-serif text-3xl text-gold">Fragrance Not Found</h1>
      </div>
    );
  }

  // البحث بالـ ID أولاً
  let { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", slugOrId)
    .eq("is_active", true)
    .maybeSingle();

  // إن لم يجده بالـ ID يبحث بالـ slug
  if (!product) {
    const { data: productBySlug } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("slug", slugOrId)
      .eq("is_active", true)
      .maybeSingle();
    product = productBySlug;
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-cream">
        <h1 className="font-serif text-3xl text-gold">Fragrance Not Found</h1>
        <p className="mt-3 text-sm text-cream/50">Product: {slugOrId}</p>
        <a
          href="/shop"
          className="mt-6 border border-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-ink"
        >
          Return To Collection
        </a>
      </div>
    );
  }

  // Approved reviews are public (RLS); only buyers whose order was delivered may write one.
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at")
    .eq("product_id", product.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(30);
  const user = await getUser();
  let canReview = false;
  if (user) {
    const { data: delivered } = await supabaseServer()
      .from("orders")
      .select("id, order_items!inner(product_id)")
      .eq("user_id", user.id)
      .ilike("status", "%delivered%")
      .eq("order_items.product_id", product.id)
      .limit(1);
    canReview = (delivered ?? []).length > 0;
  }
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <main className="min-h-screen bg-ink pt-24 text-cream">
      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <ProductPurchaseSection product={product} whatsapp={(await getSettings())?.whatsapp_number} />

        <section className="mt-16 max-w-2xl border-t border-white/10 pt-8">
          <h2 className="font-serif text-2xl uppercase tracking-wider text-cream">
            Reviews {avg > 0 && <span className="ms-2 text-base text-gold">★ {avg.toFixed(1)} <span className="text-cream/50">({reviews!.length})</span></span>}
          </h2>
          {(reviews ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-cream/50">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews!.map((r) => (
                <div key={r.id} className="border border-white/10 bg-surface p-4">
                  <p className="text-gold">{"★".repeat(r.rating)}<span className="text-cream/20">{"★".repeat(5 - r.rating)}</span></p>
                  <p className="mt-1 text-sm text-cream/80">{r.body}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-widest text-cream/40">Verified buyer · {new Date(r.created_at).toLocaleDateString("en-GB", { timeZone: "Africa/Cairo" })}</p>
                </div>
              ))}
            </div>
          )}
          <ReviewForm productId={product.id} loggedIn={!!user} canReview={canReview} />
        </section>
      </div>
    </main>
  );
}
