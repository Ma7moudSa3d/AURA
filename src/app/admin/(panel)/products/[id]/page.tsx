import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadgzq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  if (!productId) {
    notFound();
  }

  // البحث عن العطر بالـ ID أو الـ Slug
  let { data: product } = await supabase
    .from("products")
    .select("*, variants(*)")
    .eq("id", productId)
    .single();

  if (!product) {
    const { data: productBySlug } = await supabase
      .from("products")
      .select("*, variants(*)")
      .eq("slug", productId)
      .single();
    product = productBySlug;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-serif text-[#C5A059] mb-4">Fragrance Not Found</h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          The fragrance you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-[#C5A059] text-black font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-[#D4AF37] transition-all"
        >
          Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <ProductPurchaseSection product={product} />
    </main>
  );
}
