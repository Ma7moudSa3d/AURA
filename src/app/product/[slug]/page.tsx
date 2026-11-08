import React from "react";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import { getSettings } from "@/lib/data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadqzg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    .maybeSingle();

  // إن لم يجده بالـ ID يبحث بالـ slug
  if (!product) {
    const { data: productBySlug } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("slug", slugOrId)
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

  return (
    <main className="min-h-screen bg-ink pt-24 text-cream">
      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <ProductPurchaseSection product={product} whatsapp={(await getSettings())?.whatsapp_number} />
      </div>
    </main>
  );
}
