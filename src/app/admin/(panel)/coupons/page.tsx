import { supabaseServer } from "@/lib/supabase/server";
import { saveCoupon, deleteCoupon } from "@/app/actions/admin";
import DeleteButton from "@/components/DeleteButton";

export default async function Coupons() {
  const { data } = await supabaseServer().from("coupons").select("*").order("code");
  return (
    <div className="space-y-8">
      <form action={saveCoupon} className="grid gap-3 border border-white/5 bg-surface p-5 sm:grid-cols-5">
        <input name="code" required placeholder="CODE" className="input uppercase" />
        <select name="type" className="input"><option value="percent">Percent</option><option value="fixed">Fixed (EGP)</option></select>
        <input name="value" type="number" step="0.01" min="0.01" required placeholder="Value" className="input" />
        <input name="expires_at" type="datetime-local" className="input" />
        <input name="max_uses" type="number" min="1" placeholder="Max uses" className="input" />
        <button className="btn-gold sm:col-span-5">Save coupon</button>
      </form>
      <table className="w-full border border-white/5 bg-surface text-sm"><thead className="text-left text-xs uppercase tracking-widest text-cream/50"><tr><th className="p-3">Code</th><th>Type</th><th>Value</th><th>Used</th><th>Expires</th><th /></tr></thead>
        <tbody>{(data ?? []).map((c) => (
          <tr key={c.id} className="border-t border-white/5"><td className="p-3 text-gold">{c.code}</td><td>{c.type}</td><td>{Number(c.value)}</td>
            <td>{c.used_count}/{c.max_uses ?? "∞"}</td><td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-GB") : "—"}</td>
            <td><DeleteButton onDelete={deleteCoupon.bind(null, c.id)} /></td></tr>))}</tbody></table>
    </div>
  );
}
