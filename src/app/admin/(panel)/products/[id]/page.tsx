import React from "react";
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
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-serif text-[#C5A059] mb-4">Product Not Found</h1>
      </div>
    );
  }

  // جلب المنتج مع جدول الصور الخاص به product_images
  let { data: product } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", productId)
    .single();

  if (!product) {
    const { data: productBySlug } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("slug", productId)
      .single();
    product = productBySlug;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-serif text-[#C5A059] mb-4">Fragrance Not Found</h1>
        <p className="text-zinc-400 mb-6 text-sm">Product ID: {productId}</p>
        <a
          href="/shop"
          className="px-6 py-2 bg-transparent border border-[#C5A059] text-[#C5A059] font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-[#C5A059] hover:text-black transition-all"
        >
          Return to Collection
        </a>
      </div>
    );
  }

  // ضبط أسرار الحقول لتعمل بالتوافق مع المكونات
  const normalizedProduct = {
    ...product,
    name: product.title_en || product.title_ar || "AURA Fragrance",
    price: product.price || 0,
    discount_price: product.discount_price,
    image_url:
      product.product_images && product.product_images.length > 0
        ? (product.product_images[0].image_url || product.product_images[0].url || product.product_images[0].path)
        : (product.image_url || product.image)
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <ProductPurchaseSection product={normalizedProduct} />
    </main>
  );
}
