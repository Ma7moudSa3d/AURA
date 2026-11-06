// src/app/admin/(panel)/products/[id]/ProductFormClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveProduct, deleteProductImage } from "@/app/actions/admin"
import { ProductVariant } from "@/lib/types"

interface ProductFormClientProps {
  product?: any
}

export default function ProductFormClient({ product }: ProductFormClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // تهيئة السعات والأسعار المتعددة (إذا كان المنتج قديم يأخذ السعة والسعر الحالية كـ Variant أول)
  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants
    }
    return [
      {
        volume: product?.volume || "50ml",
        price: product?.price || 0,
        discount_price: product?.discount_price || null,
        stock_qty: product?.stock_qty || 25,
      },
    ]
  })

  const addVariant = () => {
    setVariants([
      ...variants,
      { volume: "10ml", price: 200, discount_price: null, stock_qty: 20 },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    // إرسال مصفوفة السعات كـ JSON إلى السيرفر
    formData.set("variants", JSON.stringify(variants))

    // جعل السعر والمخزون الأساسي يساوي السعة الأولى كـ Fallback
    if (variants.length > 0) {
      formData.set("price", String(variants[0].price))
      if (variants[0].discount_price) {
        formData.set("discount_price", String(variants[0].discount_price))
      }
      formData.set("volume", variants[0].volume)
    }

    const res = await saveProduct(formData)
    setLoading(false)

    if (!res.ok) {
      setError(res.error || "Failed to save product")
    } else {
      router.push("/admin/products")
      router.refresh()
    }
  }

  const handleDeleteImg = async (imgId: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      await deleteProductImage(imgId)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl bg-ink/40 p-6 border border-white/10 rounded-lg">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">
          {error}
        </div>
      )}

      {product?.id && <input type="hidden" name="id" value={product.id} />}

      {/* Basic Titles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Title (EN)</label>
          <input
            type="text"
            name="title_en"
            defaultValue={product?.title_en || ""}
            required
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Title (AR)</label>
          <input
            type="text"
            name="title_ar"
            defaultValue={product?.title_ar || ""}
            required
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none text-right"
          />
        </div>
      </div>

      {/* Slug, Gender & Collection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Slug</label>
          <input
            type="text"
            name="slug"
            defaultValue={product?.slug || ""}
            required
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Gender</label>
          <select
            name="gender"
            defaultValue={product?.gender || "unisex"}
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          >
            <option value="unisex">Unisex (جنسين)</option>
            <option value="men">Men (رجالي)</option>
            <option value="women">Women (حريمي)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Collection</label>
          <input
            type="text"
            name="collection"
            defaultValue={product?.collection || "Luxury Collection"}
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
      </div>

      {/* 🌟 قسم السعات والأسعار المتعددة (VARIANTS SECTION) */}
      <div className="border border-gold/40 p-5 bg-gold/5 rounded-lg space-y-4">
        <div className="flex justify-between items-center border-b border-gold/20 pb-3">
          <div>
            <h3 className="text-gold font-bold text-sm tracking-wider uppercase">
              Product Sizes & Pricing / السعات والأسعار المتعددة
            </h3>
            <p className="text-xs text-cream/70 mt-0.5">
              يمكنك إضافة أكثر من سعة (مثل 5ml, 10ml, 50ml, 100ml) وتحديد سعر الخصم والمخزون لكل سعة.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1.5 bg-gold text-ink font-bold text-xs uppercase hover:bg-gold-light transition rounded"
          >
            + Add Size (إضافة سعة)
          </button>
        </div>

        <div className="space-y-3">
          {variants.map((v, index) => (
            <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-surface p-3 border border-white/10 rounded">
              <div className="w-full md:w-1/4">
                <label className="block text-[10px] text-gold uppercase mb-1">Volume (السعة)</label>
                <input
                  type="text"
                  value={v.volume}
                  placeholder="e.g. 50ml"
                  onChange={(e) => updateVariant(index, "volume", e.target.value)}
                  className="w-full bg-ink border border-white/10 px-2 py-1 text-xs text-white focus:border-gold outline-none"
                />
              </div>
              <div className="w-1/2 md:w-1/4">
                <label className="block text-[10px] text-gold uppercase mb-1">Price (السعر EGP)</label>
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => updateVariant(index, "price", Number(e.target.value))}
                  className="w-full bg-ink border border-white/10 px-2 py-1 text-xs text-white focus:border-gold outline-none"
                />
              </div>
              <div className="w-1/2 md:w-1/4">
                <label className="block text-[10px] text-gold uppercase mb-1">Discount Price (سعر الخصم)</label>
                <input
                  type="number"
                  value={v.discount_price ?? ""}
                  placeholder="اختياري"
                  onChange={(e) => updateVariant(index, "discount_price", e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-ink border border-white/10 px-2 py-1 text-xs text-white focus:border-gold outline-none"
                />
              </div>
              <div className="w-1/2 md:w-1/5">
                <label className="block text-[10px] text-gold uppercase mb-1">Stock (المخزون)</label>
                <input
                  type="number"
                  value={v.stock_qty ?? 10}
                  onChange={(e) => updateVariant(index, "stock_qty", Number(e.target.value))}
                  className="w-full bg-ink border border-white/10 px-2 py-1 text-xs text-white focus:border-gold outline-none"
                />
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/20 hover:border-red-500/50 mt-4 md:mt-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Stock & Low Stock Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Total Stock Quantity</label>
          <input
            type="number"
            name="stock_qty"
            defaultValue={product?.stock_qty || 25}
            required
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Low Stock Alert Threshold</label>
          <input
            type="number"
            name="low_stock_threshold"
            defaultValue={product?.low_stock_threshold || 5}
            required
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Description (EN)</label>
          <textarea
            name="description_en"
            rows={4}
            defaultValue={product?.description_en || ""}
            className="w-full bg-surface border border-white/10 p-3 text-white focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Description (AR)</label>
          <textarea
            name="description_ar"
            rows={4}
            defaultValue={product?.description_ar || ""}
            className="w-full bg-surface border border-white/10 p-3 text-white focus:border-gold outline-none text-right"
          />
        </div>
      </div>

      {/* Fragrance Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Top Notes (قمة العطر)</label>
          <input
            type="text"
            name="top_notes"
            defaultValue={product?.notes?.top_notes?.join(", ") || ""}
            placeholder="Mango, Ginger, Lemon"
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white text-xs focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Heart Notes (قلب العطر)</label>
          <input
            type="text"
            name="heart_notes"
            defaultValue={product?.notes?.heart_notes?.join(", ") || ""}
            placeholder="Jasmine, Coumarin"
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white text-xs focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Base Notes (قاعدة العطر)</label>
          <input
            type="text"
            name="base_notes"
            defaultValue={product?.notes?.base_notes?.join(", ") || ""}
            placeholder="Amber, Musk, Oud"
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white text-xs focus:border-gold outline-none"
          />
        </div>
      </div>

      {/* Tags & Concentration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Default Volume Label</label>
          <input
            type="text"
            name="volume"
            defaultValue={product?.volume || "50ml"}
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Concentration</label>
          <input
            type="text"
            name="concentration"
            defaultValue={product?.concentration || "Eau de Parfum"}
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-1">Tags (Comma Separated)</label>
          <input
            type="text"
            name="tags"
            defaultValue={product?.tags?.join(", ") || ""}
            placeholder="Mango, Tropical, Niche"
            className="w-full bg-surface border border-white/10 px-3 py-2 text-white focus:border-gold outline-none"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6 py-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-cream">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
            className="accent-gold"
          />
          Active (ظاهر للمشترين)
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-cream">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
            className="accent-gold"
          />
          Featured (عطر مميز)
        </label>
      </div>

      {/* Existing Images */}
      {product?.images && product.images.length > 0 && (
        <div>
          <label className="block text-xs uppercase tracking-wider text-gold mb-2">Existing Images</label>
          <div className="flex flex-wrap gap-4">
            {product.images.map((img: any) => (
              <div key={img.id} className="relative group w-24 h-24 border border-white/10 rounded overflow-hidden">
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img.path}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImg(img.id)}
                  className="absolute inset-0 bg-red-900/80 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Images */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-gold mb-1">Upload Product Images</label>
        <input
          type="file"
          name="images"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="w-full bg-surface border border-white/10 p-2 text-xs text-cream/70"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gold text-ink font-bold text-sm tracking-widest uppercase hover:bg-gold-light transition disabled:opacity-50"
      >
        {loading ? "Saving..." : product?.id ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
      </button>
    </form>
  )
}
