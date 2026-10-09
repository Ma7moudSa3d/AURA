import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { deleteProduct } from "@/app/actions/admin";
import DeleteButton from "@/components/DeleteButton";

export default async function AdminProducts() {
  const { data } = await supabaseServer().from("products").select("id,slug,title_en,price,stock_qty,low_stock_threshold,is_active").order("created_at", { ascending: false });
  return (
    <div>
      <Link href="/admin/products/new" className="btn-gold mb-6">+ New product</Link>
      <div className="overflow-x-auto border border-white/5 bg-surface">
        <table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-widest text-cream/50"><tr><th className="p-3">Product</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
          <tbody>{(data ?? []).map((p) => (
            <tr key={p.id} className="border-t border-white/5">
              <td className="p-3"><Link className="text-gold" href={`/admin/products/${p.id}`}>{p.title_en}</Link></td><td>{Number(p.price)}</td>
              <td className={p.stock_qty <= p.low_stock_threshold ? "text-red-300" : ""}>{p.stock_qty}</td><td>{p.is_active ? "Active" : "Hidden"}</td>
              <td><DeleteButton onDelete={deleteProduct.bind(null, p.id)} /></td>
            </tr>))}</tbody></table>
      </div>
    </div>
  );
}
