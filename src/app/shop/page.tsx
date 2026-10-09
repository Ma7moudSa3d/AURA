import { getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const metadata = { title: "Shop" };
type SP = { q?: string; collection?: string; gender?: string; min?: string; max?: string; best?: string; stock?: string; sort?: string };

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const t = await getTranslations("shop");
  const sb = supabaseServer();
  const { data: cols } = await sb.from("products").select("collection").eq("is_active", true);
  const collections = [...new Set((cols ?? []).map((c) => c.collection).filter(Boolean))] as string[];

  let q = sb.from("products").select("*, product_images(id, path, sort_order)").eq("is_active", true);
  const term = (searchParams.q ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
  if (term) q = q.or(`title_en.ilike.%${term}%,title_ar.ilike.%${term}%`);
  if (searchParams.collection) q = q.eq("collection", searchParams.collection);
  if (["unisex", "men", "women"].includes(searchParams.gender ?? "")) q = q.eq("gender", searchParams.gender!);
  const min = Number(searchParams.min), max = Number(searchParams.max);
  if (searchParams.min && !isNaN(min)) q = q.gte("price", min);
  if (searchParams.max && !isNaN(max)) q = q.lte("price", max);
  if (searchParams.best === "1") q = q.gt("units_sold", 0);
  if (searchParams.stock === "1") q = q.gt("stock_qty", 0);
  switch (searchParams.sort) {
    case "price_asc": q = q.order("price", { ascending: true }); break;
    case "price_desc": q = q.order("price", { ascending: false }); break;
    case "newest": q = q.order("created_at", { ascending: false }); break;
    case "best": q = q.order("units_sold", { ascending: false }); break;
    default: q = q.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }
  const { data } = await q;
  const products = (data ?? []) as Product[];

  return (
    <div className="container-x py-12">
      <h1 className="h-display mb-8 text-center text-5xl">{t("title")}</h1>
      <form className="mb-10 grid gap-4 border border-white/5 bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4" method="get">
        <input name="q" defaultValue={searchParams.q} placeholder={t("search")} className="input sm:col-span-2" />
        <select name="collection" defaultValue={searchParams.collection ?? ""} className="input">
          <option value="">{t("collection")}: {t("all")}</option>
          {collections.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="gender" defaultValue={searchParams.gender ?? ""} className="input">
          <option value="">{t("gender")}: {t("all")}</option>
          <option value="unisex">{t("unisex")}</option><option value="men">{t("men")}</option><option value="women">{t("women")}</option>
        </select>
        <input name="min" type="number" min={0} defaultValue={searchParams.min} placeholder={`${t("price")} ${t("min")}`} className="input" />
        <input name="max" type="number" min={0} defaultValue={searchParams.max} placeholder={`${t("price")} ${t("max")}`} className="input" />
        <select name="sort" defaultValue={searchParams.sort ?? ""} className="input">
          <option value="">{t("sort")}: {t("featured")}</option>
          <option value="price_asc">{t("priceAsc")}</option><option value="price_desc">{t("priceDesc")}</option>
          <option value="newest">{t("newest")}</option><option value="best">{t("best")}</option>
        </select>
        <div className="flex items-center gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="best" value="1" defaultChecked={searchParams.best === "1"} className="accent-[#D6B25E]" />{t("bestsellers")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="stock" value="1" defaultChecked={searchParams.stock === "1"} className="accent-[#D6B25E]" />{t("instock")}</label>
        </div>
        <button className="btn-gold sm:col-span-2 lg:col-span-4">{t("apply")}</button>
      </form>
      {products.length === 0 ? <p className="text-center text-cream/60">{t("none")}</p> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
