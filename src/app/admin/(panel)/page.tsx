import { supabaseServer } from "@/lib/supabase/server";
import AdminCharts from "@/components/AdminCharts";
import ReminderButton from "@/components/ReminderButton";

export default async function Dashboard() {
  const { data } = await supabaseServer().rpc("admin_analytics", { p_days: 30 });
  const a = data as any;
  const stat = (label: string, value: string) => (
    <div className="card p-5"><p className="text-xs uppercase tracking-widest text-cream/50">{label}</p><p className="h-display mt-2 text-4xl text-gold">{value}</p></div>
  );
  const f = (n: number) => new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(Number(n));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Revenue (paid)", `${f(a?.revenue ?? 0)} EGP`)}{stat("Total orders", f(a?.orders ?? 0))}
        {stat("Pending verification", f(a?.pending ?? 0))}{stat("Avg order value", `${f(a?.aov ?? 0)} EGP`)}
      </div>
      <AdminCharts daily={a?.daily ?? []} weekly={a?.weekly ?? []} monthly={a?.monthly ?? []} />
      <div className="border border-white/5 bg-surface p-5">
        <h2 className="h-display mb-4 text-2xl">Best sellers</h2>
        <table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-widest text-cream/50"><tr><th className="py-2">Product</th><th>Units</th><th>Revenue</th></tr></thead>
          <tbody>{(a?.best ?? []).map((b: any) => <tr key={b.title} className="border-t border-white/5"><td className="py-2">{b.title}</td><td>{b.units}</td><td>{f(b.revenue)} EGP</td></tr>)}</tbody></table>
      </div>
      <ReminderButton />
    </div>
  );
}
