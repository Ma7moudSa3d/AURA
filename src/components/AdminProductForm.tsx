"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, deleteProductImage } from "@/app/actions/admin";
import { imageUrl } from "@/lib/format";
import type { Product } from "@/lib/types";

const toLocal = (s: string | null) => (s ? new Date(s).toISOString().slice(0, 16) : "");

export default function AdminProductForm({ p }: { p: Product | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const notes = Array.isArray(p?.product_notes) ? (p!.product_notes as any)[0] : p?.product_notes;
  const f = (label: string, name: string, def: string | number | null | undefined, type = "text", extra: object = {}) => (
    <div><label className="label">{label}</label><input name={name} type={type} defaultValue={def ?? ""} className="input" {...extra} /></div>
  );
  return (
    <form className="grid gap-5 sm:grid-cols-2" action={(fd) => start(async () => {
      setMsg(null); const r = await saveProduct(fd);
      if (r.ok) { router.push("/admin/products"); router.refresh(); } else setMsg(r.error ?? "Failed");
    })}>
      {p && <input type="hidden" name="id" value={p.id} />}
      {f("Title (EN)", "title_en", p?.title_en, "text", { required: true })}{f("Title (AR)", "title_ar", p?.title_ar, "text", { required: true, dir: "rtl" })}
      {f("Slug (unique, a-z 0-9 -)", "slug", p?.slug, "text", { required: true, pattern: "[a-z0-9-]+" })}{f("Collection", "collection", p?.collection)}
      <div><label className="label">Description (EN)</label><textarea name="description_en" rows={4} defaultValue={p?.description_en ?? ""} className="input" /></div>
      <div><label className="label">Description (AR)</label><textarea name="description_ar" dir="rtl" rows={4} defaultValue={p?.description_ar ?? ""} className="input" /></div>
      {f("Price (EGP)", "price", p?.price, "number", { required: true, min: 0, step: "0.01" })}{f("Discount price (optional)", "discount_price", p?.discount_price, "number", { min: 0, step: "0.01" })}
      {f("Discount % (optional)", "discount_percent", p?.discount_percent, "number", { min: 0, max: 100, step: "0.01" })}<div />
      {f("Discount starts", "discount_start", toLocal(p?.discount_start ?? null), "datetime-local")}{f("Discount ends", "discount_end", toLocal(p?.discount_end ?? null), "datetime-local")}
      {f("Stock", "stock_qty", p?.stock_qty ?? 0, "number", { required: true, min: 0 })}{f("Low-stock threshold", "low_stock_threshold", p?.low_stock_threshold ?? 5, "number", { required: true, min: 0 })}
      <div><label className="label">Gender</label><select name="gender" defaultValue={p?.gender ?? "unisex"} className="input"><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option></select></div>
      {f("Tags (comma separated)", "tags", p?.tags?.join(", "))}
      {f("Volume", "volume", p?.volume ?? "50ml")}{f("Concentration", "concentration", p?.concentration ?? "EDP")}
      {f("Top notes (comma separated)", "top_notes", notes?.top_notes?.join(", "))}{f("Heart notes", "heart_notes", notes?.heart_notes?.join(", "))}
      {f("Base notes", "base_notes", notes?.base_notes?.join(", "))}<div />
      <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} className="accent-[#D6B25E]" /> Active</label>
      <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={p?.is_featured ?? false} className="accent-[#D6B25E]" /> Featured</label>
      <div className="sm:col-span-2">
        <label className="label">Add images (JPG/PNG/WebP, ≤5MB)</label>
        <input type="file" name="images" multiple accept="image/jpeg,image/png,image/webp" className="input" />
        <div className="mt-3 flex flex-wrap gap-3">
          {(p?.product_images ?? []).map((i) => (
            <div key={i.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(i.path)} alt="" className="h-24 w-20 object-cover" />
              <button type="button" className="absolute -end-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs" onClick={() => start(async () => { await deleteProductImage(i.id); router.refresh(); })}>✕</button>
            </div>
          ))}
        </div>
      </div>
      {msg && <p className="text-sm text-red-400 sm:col-span-2">{msg}</p>}
      <button disabled={pending} className="btn-gold sm:col-span-2">Save product</button>
    </form>
  );
}
