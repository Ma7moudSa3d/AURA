import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/types";

type SP = { status?: string; q?: string; from?: string; to?: string };

export default async function Orders({ searchParams }: { searchParams: SP }) {
  let q = supabaseServer().from("orders").select("id,status,total,created_at,customer_name,customer_email").order("created_at", { ascending: false }).limit(200);
  if ((ORDER_STATUSES as readonly string[]).includes(searchParams.status ?? "")) q = q.eq("status", searchParams.status!);
  const term = (searchParams.q ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
  if (term) q = q.or(`customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`);
  if (searchParams.from) q = q.gte("created_at", searchParams.from);
  if (searchParams.to) q = q.lte("created_at", searchParams.to + "T23:59:59");
  const { data } = await q;
  return (
    <div>
      <form className="mb-6 grid gap-3 sm:grid-cols-5" method="get">
        <input name="q" defaultValue={searchParams.q} placeholder="Customer name / email" className="input sm:col-span-2" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input"><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" name="from" defaultValue={searchParams.from} className="input" /><input type="date" name="to" defaultValue={searchParams.to} className="input" />
        <button className="btn-gold sm:col-span-4">Filter</button>
        <a href="/api/admin/orders-csv" className="btn-ghost">Export CSV</a>
      </form>
      <div className="overflow-x-auto border border-white/5 bg-surface">
        <table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-widest text-cream/50"><tr><th className="p-3">Order</th><th>Date</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>{(data ?? []).map((o) => (
            <tr key={o.id} className="border-t border-white/5 hover:bg-white/[.02]">
              <td className="p-3"><Link className="font-mono text-gold" href={`/admin/orders/${o.id}`}>{o.id.slice(0, 8).toUpperCase()}</Link></td>
              <td>{new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })}</td>
              <td>{o.customer_name}<br /><span className="text-xs text-cream/50">{o.customer_email}</span></td>
              <td className="text-xs">{o.status}</td><td className="text-gold">{Number(o.total)} EGP</td>
            </tr>))}</tbody></table>
      </div>
    </div>
  );
}
