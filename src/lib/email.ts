import { Resend } from "resend";
import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM ?? "AURA <onboarding@resend.dev>";
export const OWNER = process.env.OWNER_EMAIL ?? "ofoftot@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Sends via Resend (free tier); falls back to SMTP (Nodemailer) if SMTP_HOST is configured or Resend fails. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (process.env.RESEND_API_KEY) {
    try {
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to, subject, html });
      if (!error) return true;
      console.error("Resend error", error);
    } catch (e) { console.error("Resend failed", e); }
  }
  if (process.env.SMTP_HOST) {
    try {
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await t.sendMail({ from: FROM, to, subject, html });
      return true;
    } catch (e) { console.error("SMTP failed", e); }
  }
  return false;
}

const wrap = (inner: string) => `<div style="background:#0B0B0D;padding:32px;font-family:Arial,sans-serif;color:#F5F1E8">
<div style="max-width:640px;margin:auto;background:#121214;border:1px solid #B88A3B;padding:32px">
<h1 style="font-family:Georgia,serif;color:#D6B25E;letter-spacing:6px;text-align:center;margin:0 0 24px">AURA</h1>${inner}</div></div>`;

export type OrderEmailData = {
  id: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string;
  address_line1: string; address_line2?: string | null; city: string; notes?: string | null;
  subtotal: number; discount_total: number; shipping_fee: number; total: number;
  payment_method: string; transaction_reference_id?: string | null; proof_url?: string | null;
  items: { product_title_snapshot: string; qty: number; unit_price_snapshot: number; discount_snapshot: number; line_total: number }[];
};

const rows = (o: OrderEmailData) => o.items.map((i) => `<tr>
<td style="padding:6px;border-bottom:1px solid #2a2a2e">${esc(i.product_title_snapshot)}</td>
<td style="padding:6px;border-bottom:1px solid #2a2a2e;text-align:center">${i.qty}</td>
<td style="padding:6px;border-bottom:1px solid #2a2a2e;text-align:right">${i.unit_price_snapshot}</td>
<td style="padding:6px;border-bottom:1px solid #2a2a2e;text-align:right">${i.discount_snapshot}</td>
<td style="padding:6px;border-bottom:1px solid #2a2a2e;text-align:right">${i.line_total}</td></tr>`).join("");

export function orderEmailHtml(o: OrderEmailData, forOwner: boolean) {
  return wrap(`
<h2 style="color:#D6B25E;font-weight:normal">${forOwner ? "New order received" : "Thank you for your order"}</h2>
<p><b>Order ID:</b> ${esc(o.id)}<br><b>Created:</b> ${esc(new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" }))}</p>
<p><b>Customer:</b> ${esc(o.customer_name)}<br>${esc(o.customer_email)}<br>${esc(o.customer_phone)}</p>
<p><b>Ship to:</b><br>${esc(o.address_line1)}<br>${esc(o.address_line2)}<br>${esc(o.city)}${o.notes ? `<br><i>Notes: ${esc(o.notes)}</i>` : ""}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="color:#D6B25E">
<th align="left">Item</th><th>Qty</th><th align="right">Unit</th><th align="right">Discount</th><th align="right">Line</th></tr>${rows(o)}</table>
<p style="text-align:right">Subtotal: ${o.subtotal}<br>Discounts: ${o.discount_total}<br>Shipping: ${o.shipping_fee}<br><b style="color:#D6B25E;font-size:18px">Total: ${o.total} EGP</b></p>
<p><b>Payment:</b> ${esc(o.payment_method)}<br>
${o.transaction_reference_id ? `<b>Transaction ref:</b> ${esc(o.transaction_reference_id)}<br>` : ""}
${o.proof_url ? `<b>Payment proof:</b> <a style="color:#D6B25E" href="${esc(o.proof_url)}">View (link expires in 7 days)</a>` : ""}</p>
<p style="color:#999">Status: Pending payment verification</p>
${forOwner ? `<p><a style="color:#D6B25E" href="${SITE}/admin/orders/${esc(o.id)}">Open in dashboard</a></p>` : `<p><a style="color:#D6B25E" href="${SITE}/track?id=${esc(o.id)}">Track your order</a></p>`}`);
}

export function lowStockHtml(title: string, remaining: number) {
  return wrap(`<h2 style="color:#D6B25E;font-weight:normal">Low stock alert</h2>
<p><b>${esc(title)}</b> has only <b>${remaining}</b> units left.</p><p><a style="color:#D6B25E" href="${SITE}/admin/products">Open dashboard</a></p>`);
}

export function abandonedHtml(name: string, items: { title: string; qty: number }[]) {
  return wrap(`<h2 style="color:#D6B25E;font-weight:normal">Your fragrance is waiting</h2>
<p>Dear ${esc(name || "valued guest")}, you left something exquisite behind:</p>
<ul>${items.map((i) => `<li>${esc(i.title)} × ${i.qty}</li>`).join("")}</ul>
<p style="text-align:center"><a href="${SITE}/cart" style="background:#D6B25E;color:#0B0B0D;padding:12px 28px;text-decoration:none;letter-spacing:2px">COMPLETE YOUR ORDER</a></p>`);
}
