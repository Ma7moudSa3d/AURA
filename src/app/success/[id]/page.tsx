import React from "react";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default async function ProductPage({ params }: { params: any }) {
  const { id } = await params;

  // محاولة جلب البيانات
  const { data: product, error } = await supabase
    .from("products")
    .select("*, variants(*)")
    .eq("id", id)
    .single();

  // إذا كان هناك خطأ في الاتصال بقاعدة البيانات
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10">
        <h1 className="text-2xl text-[#C5A059] mb-4">Database Connection Error</h1>
        <p className="text-zinc-500">{error.message}</p>
        <p className="mt-4 text-xs text-zinc-600">ID searched: {id}</p>
        {(!process.env.NEXT_PUBLIC_SUPABASE_URL) && (
          <p className="text-red-500 mt-2">Warning: SUPABASE_URL is missing in Environment Variables!</p>
        )}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10">
        <h1 className="text-2xl text-[#C5A059] mb-4">Fragrance Not Found</h1>
        <p className="text-zinc-500">This ID does not exist in your products table.</p>
        <p className="mt-4 text-xs text-zinc-600">ID: {id}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <ProductPurchaseSection product={product} />
    </main>
  );
}
