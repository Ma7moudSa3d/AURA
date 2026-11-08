import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import OrderAdminPanel from "@/components/OrderAdminPanel";

export const dynamic = "force-dynamic";

// The admin layout (checkAdmin: owner email + email OTP + TOTP) already gated this route;
// the order is read server-side, so no keys or RLS workarounds reach the browser.
export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();

  const { data: order } = await supabaseService()
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", params.id)
    .maybeSingle();
  if (!order) notFound();

  // Older rows may carry legacy spellings; map them onto the canonical statuses.
  const LEGACY: Record<string, string> = { PENDING: "PENDING_PAYMENT_VERIFICATION", PROCESSING: "CONFIRMED", CANCELLED: "CANCELED" };
  const raw = String(order.status ?? "PENDING_PAYMENT_VERIFICATION").toUpperCase();
  const status = LEGACY[raw] ?? raw;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex text-xs uppercase tracking-widest text-cream/60 hover:text-gold">
        ← Back to Orders
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 border border-white/5 bg-surface p-5 text-sm">
          <div className="break-all font-mono font-semibold text-gold">{order.id}</div>
          <div>
            <div className="font-medium">{order.customer_name || "Customer"}</div>
            <div className="text-cream/70">{order.customer_email || "No email"} · {order.customer_phone || "No phone"}</div>
          </div>
          <div className="text-cream/80">
            {[order.address_line1, order.address_line2, order.city].filter(Boolean).join(", ") || "No address"}
          </div>
          {order.notes && <div className="whitespace-pre-line text-cream/60">Notes: {order.notes}</div>}
          <div className="text-cream/70">Payment: {order.payment_method}</div>
          {order.transaction_reference_id && (
            <div className="break-all font-mono text-cream/90">Ref: <span className="text-gold">{order.transaction_reference_id}</span></div>
          )}
          <hr className="border-white/10" />
          <div className="space-y-2">
            {order.order_items?.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between">
                <span>{i.product_title_snapshot} <span className="text-xs text-cream/50">× {i.qty}</span></span>
                <span className="font-mono">{Number(i.line_total)} EGP</span>
              </div>
            ))}
          </div>
          <hr className="border-white/10" />
          <div className="space-y-1 text-cream/70">
            <div className="flex justify-between"><span>Subtotal</span><span>{Number(order.subtotal)} EGP</span></div>
            {Number(order.discount_total) > 0 && (
              <div className="flex justify-between"><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>-{Number(order.discount_total)} EGP</span></div>
            )}
            <div className="flex justify-between"><span>Shipping</span><span>{Number(order.shipping_fee)} EGP</span></div>
          </div>
          <div className="flex justify-between text-lg font-bold text-gold"><span>Total</span><span>{Number(order.total)} EGP</span></div>
        </div>

        <OrderAdminPanel id={order.id} status={status} note={order.admin_note ?? ""} proofPath={order.payment_proof_path ?? null} />
      </div>
    </div>
  );
}
