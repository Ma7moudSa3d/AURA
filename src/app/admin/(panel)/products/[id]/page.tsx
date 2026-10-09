import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminProductForm from "@/components/AdminProductForm";
import type { Product } from "@/lib/types";

export default async function EditProduct({ params }: { params: { id: string } }) {
  let p: Product | null = null;
  if (params.id !== "new") {
    const { data } = await supabaseServer().from("products").select("*, product_images(id,path,sort_order), product_notes(*)").eq("id", params.id).single();
    if (!data) notFound();
    p = data as Product;
  }
  return <div><h1 className="h-display mb-6 text-4xl">{p ? p.title_en : "New product"}</h1><AdminProductForm p={p} /></div>;
}
