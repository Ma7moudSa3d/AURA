import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { summarize, normStatus, type OrderRow } from "@/lib/admin-users";

export const dynamic = "force-dynamic";
const dt = (d?: string | null) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Africa/Cairo", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default async function UserActivity({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const sb = supabaseService();
  const { data: au } = await sb.auth.admin.getUserById(params.id);
  if (!au?.user) notFound();
  const u = au.user;
  const [{ data: p }, { data: orders }, { data: reviews }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", params.id).maybeSingle(),
    sb.from("orders").select("id, user_id, status, total, created_at, customer_email, payment_method, coupon_code, order_items(product_title_snapshot, qty, line_total, price)").eq("user_id", params.id).order("created_at", { ascending: true }),
    sb.from("reviews").select("rating, body, is_approved, created_at").eq("user_id", params.id).order("created_at", { ascending: true }),
  ]);
  const os = (orders ?? []) as any[] as (OrderRow & { payment_method?: string; coupon_code?: string })[];
  const s = summarize(os);
  const stat = (l: string, v: string) => <div className="card p-4"><p className="text-[10px] uppercase tracking-widest text-cream/50">{l}</p><p className="h-display mt-1 text-2xl text-gold">{v}</p></div>;
  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex text-xs uppercase tracking-widest text-cream/60 hover:text-gold">← Back to Users</Link>
      <div className="border border-white/5 bg-surface p-5 text-sm">
        <p className="h-display text-2xl">{p?.full_name || p?.name || u.user_metadata?.full_name || u.email}</p>
        <p className="mt-1 text-cream/70">{u.email} · {p?.phone || "No phone"}</p>
        <p className="text-cream/70">{[p?.address, p?.city, p?.governorate].filter(Boolean).join(", ") || "No saved address"}</p>
        <p className="mt-2 text-xs text-cream/50">Joined {dt(u.created_at)} · Last sign-in {dt(u.last_sign_in_at)}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Orders", String(s.orders))}{stat("Total spent", `${Math.round(s.spent)} EGP`)}
        {stat("Avg order", `${s.avg} EGP`)}{stat("Most ordered", s.topProduct ? `${s.topProduct.title} ×${s.topProduct.units}` : "—")}
      </div>
      {s.top.length > 1 && (
        <div className="border border-white/5 bg-surface p-5">
          <h2 className="h-display mb-3 text-xl">Products ordered</h2>
          <table className="tbl w-full text-sm"><tbody>{s.top.map((t) => <tr key={t.title} className="border-t border-white/5"><td className="py-2">{t.title}</td><td>×{t.units}</td><td className="text-right">{Math.round(t.revenue)} EGP</td></tr>)}</tbody></table>
        </div>
      )}
      <div className="border border-white/5 bg-surface p-5">
        <h2 className="h-display mb-4 text-xl">Activity <span className="text-xs text-cream/40">(first order → latest)</span></h2>
        {os.length === 0 && <p className="text-sm text-cream/50">No orders yet.</p>}
        <ol className="space-y-5 border-s border-gold/30 ps-5">
          {os.map((o, i) => (
            <li key={o.id} className="relative">
              <span className="absolute -start-[1.65rem] top-1.5 h-2 w-2 rounded-full bg-gold" />
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span><span className="text-cream/40">#{i + 1}</span> <Link href={`/admin/orders/${o.id}`} className="font-mono text-gold">{o.id.slice(0, 8).toUpperCase()}</Link> · {dt(o.created_at)}</span>
                <span className="text-cream/70">{normStatus(o.status).replace(/_/g, " ")} · <b className="text-cream">{Number(o.total)} EGP</b></span>
              </div>
              <ul className="mt-1 text-xs text-cream/70">
                {(o.order_items ?? []).map((it, j) => <li key={j}>{it.product_title_snapshot} × {it.qty}</li>)}
              </ul>
              {(o.coupon_code || o.payment_method) && <p className="mt-1 text-[11px] text-cream/40">{[o.payment_method, o.coupon_code && `coupon ${o.coupon_code}`].filter(Boolean).join(" · ")}</p>}
            </li>
          ))}
        </ol>
      </div>
      {(reviews ?? []).length > 0 && (
        <div className="border border-white/5 bg-surface p-5">
          <h2 className="h-display mb-3 text-xl">Reviews</h2>
          {(reviews ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/5 py-2 text-sm">{"★".repeat(r.rating)} <span className="text-cream/70">{r.body}</span> <span className="text-[11px] text-cream/40">{r.is_approved ? "approved" : "pending"} · {dt(r.created_at)}</span></p>)}
        </div>
      )}
    </div>
  );
}
