import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import ProductFormClient from "./ProductFormClient";

export const dynamic = "force-dynamic";

// /admin/products/new  -> empty form
// /admin/products/<id> -> edit form.   (Admin layout already gated access.)
export default async function AdminProductPage({ params }: { params: { id: string } }) {
  let product: any = undefined;

  if (params.id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
    const sb = supabaseService();
    const { data } = await sb
      .from("products")
      .select("*, product_images(id, path, sort_order), product_notes(top_notes, heart_notes, base_notes)")
      .eq("id", params.id)
      .maybeSingle();
    if (!data) notFound();

    const notes = Array.isArray(data.product_notes) ? data.product_notes[0] : data.product_notes;
    product = {
      ...data,
      images: [...(data.product_images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
      notes: notes ?? { top_notes: [], heart_notes: [], base_notes: [] },
    };
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex text-xs uppercase tracking-widest text-cream/60 hover:text-gold">
        ← Back to Products
      </Link>
      <h1 className="h-display text-3xl">{product ? "Edit product" : "New product"}</h1>
      <ProductFormClient product={product} />
    </div>
  );
}
