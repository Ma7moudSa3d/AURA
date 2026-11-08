import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import AdminCharts from "@/components/AdminCharts";
import Link from "next/link";
import ReminderButton from "@/components/ReminderButton";

export default async function Dashboard() {
  const { data } = await supabaseServer().rpc("admin_analytics", { p_days: 30 });
  const a = data as any;
  const sb = supabaseServer();
  const [{ data: prods }, { data: recent }, { count: pendingReviews }] = await Promise.all([
    sb.from("products").select("id,title_en,stock_qty,low_stock_threshold").eq("is_active", true).order("stock_qty"),
    sb.from("orders").select("id,status,total,created_at,customer_name").order("created_at", { ascending: false }).limit(6),
    sb.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
  ]);
  // Today's numbers (Cairo time) and customer count; read server-side after the admin layout gate.
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }).slice(5);
  const today = ((a?.daily ?? []) as any[]).find((d) => d.day === todayKey);
  const { count: customers } = await supabaseService().from("profiles").select("id", { count: "exact", head: true });
  const lowStock = (prods ?? []).filter((p) => Number(p.stock_qty) <= Number(p.low_stock_threshold));
  const stat = (label: string, value: string) => (
    <div className="card p-5"><p className="text-xs uppercase tracking-widest text-cream/50">{label}</p><p className="h-display mt-2 text-4xl text-gold">{value}</p></div>
  );
  const f = (n: number) => new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(Number(n));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Revenue (30d, paid)", `${f(a?.revenue ?? 0)} EGP`)}{stat("Orders (30d)", f(a?.orders ?? 0))}
        {stat("Pending verification", f(a?.pending ?? 0))}{stat("Avg order value", `${f(a?.aov ?? 0)} EGP`)}
        {stat("Today's orders", f(today?.orders ?? 0))}{stat("Today's revenue", `${f(today?.revenue ?? 0)} EGP`)}
        {stat("Customers", f(customers ?? 0))}{stat("Low-stock items", f(lowStock.length))}
      </div>
      {(a?.pending > 0 || (pendingReviews ?? 0) > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {a?.pending > 0 && <Link href="/admin/orders?status=PENDING_PAYMENT_VERIFICATION" className="border border-gold/60 px-4 py-2 text-gold hover:bg-gold hover:text-ink">{a.pending} order(s) waiting for payment verification →</Link>}
          {(pendingReviews ?? 0) > 0 && <Link href="/admin/reviews" className="border border-gold/60 px-4 py-2 text-gold hover:bg-gold hover:text-ink">{pendingReviews} review(s) waiting for approval →</Link>}
        </div>
      )}
      <AdminCharts daily={a?.daily ?? []} weekly={a?.weekly ?? []} monthly={a?.monthly ?? []} />
      <div className="border border-white/5 bg-surface p-5">
        <h2 className="h-display mb-4 text-2xl">Best sellers <span className="text-xs text-cream/40">(all time)</span></h2>
        <table className="tbl w-full text-sm"><thead className="text-left text-xs uppercase tracking-widest text-cream/50"><tr><th className="py-2">Product</th><th>Units</th><th>Revenue</th></tr></thead>
          <tbody>{(a?.best ?? []).map((b: any) => <tr key={b.title} className="border-t border-white/5"><td className="py-2">{b.title}</td><td>{b.units}</td><td>{f(b.revenue)} EGP</td></tr>)}</tbody></table>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-white/5 bg-surface p-5">
          <h2 className="h-display mb-4 text-2xl">Low stock</h2>
          {lowStock.length === 0 ? <p className="text-sm text-cream/50">All products are well stocked.</p> : (
            <table className="tbl w-full text-sm"><tbody>{lowStock.map((p) => (
              <tr key={p.id} className="border-t border-white/5"><td className="py-2"><Link className="text-gold" href={`/admin/products/${p.id}`}>{p.title_en}</Link></td><td className="text-right text-red-300">{p.stock_qty} left</td></tr>
            ))}</tbody></table>
          )}
        </div>
        <div className="border border-white/5 bg-surface p-5">
          <h2 className="h-display mb-4 text-2xl">Recent orders</h2>
          {(recent ?? []).length === 0 ? <p className="text-sm text-cream/50">No orders yet.</p> : (
            <table className="tbl w-full text-sm"><tbody>{(recent ?? []).map((o) => (
              <tr key={o.id} className="border-t border-white/5"><td className="py-2"><Link className="font-mono text-gold" href={`/admin/orders/${o.id}`}>{o.id.slice(0, 8).toUpperCase()}</Link></td><td>{o.customer_name}</td><td className="text-xs text-cream/60">{String(o.status).replace(/_/g, " ")}</td><td className="text-right">{Number(o.total)} EGP</td></tr>
            ))}</tbody></table>
          )}
        </div>
      </div>
      <ReminderButton />
    </div>
  );
}
