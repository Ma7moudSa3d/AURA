import Link from "next/link";
import { loadUsers } from "@/lib/admin-users";

export const dynamic = "force-dynamic";
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", day: "2-digit", month: "short", year: "numeric" }) : "—");

export default async function Users({ searchParams }: { searchParams: { q?: string; sort?: string } }) {
  let users = await loadUsers();
  const q = (searchParams.q ?? "").trim().toLowerCase();
  if (q) users = users.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q));
  const sort = searchParams.sort ?? "joined";
  users.sort((a, b) =>
    sort === "spent" ? b.spent - a.spent : sort === "orders" ? b.orders - a.orders : new Date(b.joined).getTime() - new Date(a.joined).getTime());
  const buyers = users.filter((u) => u.orders > 0).length;
  const tab = (key: string, label: string) => (
    <Link href={`/admin/users?sort=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`border px-3 py-2 text-xs uppercase tracking-widest ${sort === key ? "border-gold text-gold" : "border-white/10 text-cream/60"}`}>{label}</Link>
  );
  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={searchParams.q} placeholder="Name / email / phone" className="input min-w-[16rem] flex-1" />
        <input type="hidden" name="sort" value={sort} />
        <button className="btn-gold px-6">Search</button>
      </form>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tab("joined", "Newest")}{tab("spent", "Top spenders")}{tab("orders", "Most orders")}
        <p className="ms-auto text-xs uppercase tracking-widest text-cream/50">{users.length} user(s) · {buyers} with orders</p>
      </div>
      {users.length === 0 && <p className="text-sm text-cream/50">No users match.</p>}
      <div className="overflow-x-auto border border-white/5 bg-surface">
        <table className="tbl w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-cream/50"><tr><th className="p-3">User</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Spent</th><th>Most ordered</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-t border-white/5 hover:bg-white/[.02]">
              <td className="p-3"><Link href={`/admin/users/${u.id}`} className="text-gold">{u.name || u.email}</Link>
                {u.name && <div className="text-xs text-cream/50">{u.email}</div>}
                {u.role === "admin" && <span className="ms-0 text-[10px] uppercase tracking-widest text-gold2">admin</span>}</td>
              <td className="text-cream/70">{u.phone || "—"}</td>
              <td className="text-cream/70">{fmt(u.joined)}</td>
              <td>{u.orders}</td>
              <td>{Math.round(u.spent)} EGP</td>
              <td className="text-cream/80">{u.topProduct ? `${u.topProduct.title} ×${u.topProduct.units}` : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
