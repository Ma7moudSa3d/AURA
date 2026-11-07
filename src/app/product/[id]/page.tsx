import React from "react";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadgzq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function ProductPageById({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 text-center text-white">
        <h1 className="font-serif text-3xl text-[#C5A059]">Fragrance Not Found</h1>
      </div>
    );
  }

  let { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    const { data: productBySlug } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("slug", id)
      .maybeSingle();
    product = productBySlug;
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center text-white">
        <h1 className="font-serif text-3xl text-[#C5A059]">Fragrance Not Found</h1>
        <p className="mt-3 text-sm text-zinc-500">Product ID: {id}</p>
        <a
          href="/shop"
          className="mt-6 border border-[#C5A059] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#C5A059] transition-all hover:bg-[#C5A059] hover:text-black"
        >
          Return To Collection
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <ProductPurchaseSection product={product} />
      </div>
    </main>
  );
}
