import React from "react";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadgzq.supabase.co";
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
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 text-center text-white">
        <h1 className="font-serif text-3xl text-[#C5A059]">Fragrance Not Found</h1>
      </div>
    );
  }

  let { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", slugOrId)
    .maybeSingle();

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center text-white">
        <h1 className="font-serif text-3xl text-[#C5A059]">Fragrance Not Found</h1>
        <p className="mt-3 text-sm text-zinc-500">ID / Slug: {slugOrId}</p>
        <a
          href="/shop"
          className="mt-6 border border-[#C5A059] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#C5A059] transition-all hover:bg-[#C5A059] hover:text-black"
        >
          Return To Collection
        </a>
      </div>
    );
  }

  let rawImage: any = null;
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const firstImg = product.product_images[0];
    rawImage = typeof firstImg === "string" ? firstImg : (firstImg?.path || firstImg?.image_url || firstImg?.url);
  }
  if (!rawImage) {
    rawImage = product.image_url || product.image || product.id;
  }

  const normalizedProduct = {
    ...product,
    name: product.title_en || product.title_ar || "AURA Fragrance",
    price: Number(product.discount_price || product.price || 0),
    description: product.description_en || product.description_ar || product.description || "",
    image_url: rawImage,
    image: rawImage,
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <ProductPurchaseSection product={normalizedProduct} />
      </div>
    </main>
  );
}
