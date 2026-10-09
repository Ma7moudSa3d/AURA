import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import OrderAdminPanel from "@/components/OrderAdminPanel";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: o } = await sb.from("orders").select("*, order_items(*)").eq("id", params.id).single();
  if (!o) notFound();
  const { data: events } = await sb.from("order_events").select("*").eq("order_id", o.id).order("created_at");
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 border border-white/5 bg-surface p-5 text-sm">
        <p className="font-mono text-gold">{o.id}</p>
        <p>{o.customer_name} · {o.customer_email} · <span dir="ltr">{o.customer_phone}</span></p>
        <p>{o.address_line1}{o.address_line2 ? `, ${o.address_line2}` : ""}, {o.city}</p>
        {o.notes && <p className="italic text-cream/60">{o.notes}</p>}
        <p>Txn ref: {o.transaction_reference_id ?? "—"}</p>
        <table className="w-full"><tbody>{o.order_items.map((i: any) => (
          <tr key={i.id} className="border-t border-white/5"><td className="py-1">{i.product_title_snapshot} × {i.qty}</td><td className="text-end">{Number(i.line_total)}</td></tr>))}</tbody></table>
        <p className="text-end">Shipping {Number(o.shipping_fee)} · Discounts {Number(o.discount_total)}<br /><b className="text-lg text-gold">Total {Number(o.total)} EGP</b></p>
        <div className="border-t border-white/10 pt-3 text-xs text-cream/50">{(events ?? []).map((e) => <p key={e.id}>{new Date(e.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })} — {e.event_type}: {e.message}</p>)}</div>
      </div>
      <OrderAdminPanel id={o.id} status={o.status} note={o.admin_note ?? ""} proofPath={o.payment_proof_path} />
    </div>
  );
}
