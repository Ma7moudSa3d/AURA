import { supabaseServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ProductFormClient from "./ProductFormClient"

export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new"
  let product: any = null

  if (!isNew) {
    const sb = supabaseServer()
    const { data: p } = await sb
      .from("products")
      .select("*, product_images(*), product_notes(*)")
      .eq("id", params.id)
      .single()

    if (!p) return notFound()

    product = {
      ...p,
      images: p.product_images ?? [],
      notes: Array.isArray(p.product_notes) ? p.product_notes[0] : p.product_notes,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h1 className="text-2xl font-serif text-gold">
          {isNew ? "Add New Product" : `Edit Product: ${product?.title_en}`}
        </h1>
      </div>

      <ProductFormClient product={product} />
    </div>
  )
}
