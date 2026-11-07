import React from "react";
import { createClient } from "@supabase/supabase-js";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwisnczaffrouaadgzq.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default async function Page({ params }: any) {
  const { slug } = await params;

  // جلب المنتج
  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .or(`id.eq.${slug},slug.eq.${slug}`)
    .maybeSingle();

  if (!product) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Product Not Found</div>;
  }

  // معالجة البيانات للمكون
  const normalized = {
    ...product,
    name: product.title_en || product.name,
    price: product.price,
    image_url: product.image_url || (product.product_images?.[0]?.path)
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <ProductPurchaseSection product={normalized} />
      </div>
    </main>
  );
}
