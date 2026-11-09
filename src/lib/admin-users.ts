import { supabaseService } from "@/lib/supabase/server";

const DEAD = ["CANCELED", "CANCELLED", "REFUNDED"];
const LEGACY: Record<string, string> = { PENDING: "PENDING_PAYMENT_VERIFICATION", PROCESSING: "CONFIRMED", CANCELLED: "CANCELED" };
export const normStatus = (s?: string | null) => { const k = String(s ?? "").toUpperCase(); return LEGACY[k] ?? k; };
const baseTitle = (t?: string | null) => String(t ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim() || "Unknown";

export type OrderRow = { id: string; user_id: string | null; status: string; total: number; created_at: string; customer_email: string | null; order_items: { product_title_snapshot: string | null; qty: number; line_total: number | null; price: number | null }[] };

/** Every customer (auth accounts + guests who ordered), with order stats. Server-only; the admin layout gates the routes. */
export async function loadUsers() {
  const sb = supabaseService();
  const [{ data: authPage }, { data: profiles }, { data: orders }] = await Promise.all([
    sb.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    sb.from("profiles").select("id, full_name, name, phone, email, city, governorate, role, created_at"),
    sb.from("orders").select("id, user_id, status, total, created_at, customer_email, order_items(product_title_snapshot, qty, line_total, price)").order("created_at", { ascending: true }).limit(5000),
  ]);
  const prof = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const byUser = new Map<string, OrderRow[]>();
  for (const o of (orders ?? []) as any[]) {
    if (!o.user_id) continue;
    if (!byUser.has(o.user_id)) byUser.set(o.user_id, []);
    byUser.get(o.user_id)!.push(o);
  }
  return (authPage?.users ?? []).map((u: any) => {
    const p: any = prof.get(u.id) ?? {};
    const os = byUser.get(u.id) ?? [];
    return { id: u.id as string, email: (u.email ?? p.email ?? "") as string, name: (p.full_name || p.name || u.user_metadata?.full_name || "") as string,
      phone: (p.phone ?? "") as string, city: [p.city, p.governorate].filter(Boolean).join(", "), role: (p.role ?? "customer") as string,
      joined: u.created_at as string, lastSignIn: (u.last_sign_in_at ?? null) as string | null, ...summarize(os) };
  });
}

export function summarize(os: OrderRow[]) {
  const live = os.filter((o) => !DEAD.includes(normStatus(o.status)));
  const spent = live.reduce((a, o) => a + Number(o.total || 0), 0);
  const counts = new Map<string, { units: number; revenue: number }>();
  for (const o of live) for (const it of o.order_items ?? []) {
    const t = baseTitle(it.product_title_snapshot);
    const c = counts.get(t) ?? { units: 0, revenue: 0 };
    c.units += Number(it.qty || 0); c.revenue += Number(it.line_total ?? Number(it.price || 0) * Number(it.qty || 0));
    counts.set(t, c);
  }
  const top = [...counts.entries()].map(([title, v]) => ({ title, ...v })).sort((a, b) => b.units - a.units);
  return { orders: os.length, spent, avg: live.length ? Math.round(spent / live.length) : 0, top, topProduct: top[0] ?? null, lastOrderAt: os.length ? os[os.length - 1].created_at : null, firstOrderAt: os.length ? os[0].created_at : null };
}
