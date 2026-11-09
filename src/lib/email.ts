import { Resend } from "resend";
import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM ?? "AURA <aurafragrances111@gmail.com>";
export const OWNER = process.env.OWNER_EMAIL ?? "aurafragrances111@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aura-perfume-weld.vercel.app";

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type EmailResult = { ok: boolean; provider?: string; error?: string };

/**
 * Sends one email and tells you exactly why it failed.
 * Order: Brevo API -> Resend -> SMTP. Every failure is logged with the provider's real answer.
 * Brevo needs BREVO_API_KEY and a sender that is VERIFIED in Brevo (BREVO_SENDER_EMAIL, defaults to OWNER_EMAIL).
 */
export async function sendEmailDetailed(to: string, subject: string, html: string): Promise<EmailResult> {
  const errors: string[] = [];

  const brevoKey = process.env.BREVO_API_KEY?.trim();
  if (brevoKey) {
    const sender = (process.env.BREVO_SENDER_EMAIL || OWNER).trim();
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { accept: "application/json", "api-key": brevoKey, "content-type": "application/json" },
        body: JSON.stringify({ sender: { name: "AURA Fragrances", email: sender }, to: [{ email: to }], subject, htmlContent: html }),
      });
      if (res.ok) return { ok: true, provider: "brevo" };
      const msg = `Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`;
      console.error("[email]", msg, "| sender:", sender);
      errors.push(msg);
    } catch (e) {
      const msg = `Brevo request failed: ${e instanceof Error ? e.message : String(e)}`;
      console.error("[email]", msg);
      errors.push(msg);
    }
  } else {
    errors.push("BREVO_API_KEY is not set in this environment");
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to, subject, html });
      if (!error) return { ok: true, provider: "resend" };
      errors.push(`Resend: ${JSON.stringify(error)}`);
      console.error("[email] Resend error", error);
    } catch (e) {
      errors.push(`Resend failed: ${e instanceof Error ? e.message : String(e)}`);
      console.error("[email] Resend failed", e);
    }
  }

  if (process.env.SMTP_HOST) {
    try {
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await t.sendMail({ from: FROM, to, subject, html });
      return { ok: true, provider: "smtp" };
    } catch (e) {
      errors.push(`SMTP failed: ${e instanceof Error ? e.message : String(e)}`);
      console.error("[email] SMTP failed", e);
    }
  }

  return { ok: false, error: errors.join(" | ") };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  return (await sendEmailDetailed(to, subject, html)).ok;
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

export type GoldenOffer = { code: string; type: string };

/** Golden Friday launch announcement (Arabic first, English below). Brand: ink + gold on cream text. */
export function goldenFridayHtml(name: string, offers: GoldenOffer[], endsAt?: string | null) {
  const hello = name.trim().split(/\s+/)[0] || "";
  const a = offers.find((o) => o.type === "BUNDLE_2X100_FREE50");
  const b = offers.find((o) => o.type === "BUNDLE_2X50_THIRD_HALF");
  const until = endsAt
    ? new Date(endsAt).toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "long" })
    : "";
  const untilAr = endsAt ? new Date(endsAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long" }) : "";
  const link = `${SITE}/#offers`;
  const chip = (c: string) =>
    `<span style="display:inline-block;border:1px dashed #D6B25E;color:#D6B25E;padding:4px 12px;letter-spacing:3px;font-weight:bold;font-size:13px">${esc(c)}</span>`;
  const card = (n: string, titleAr: string, titleEn: string, ar: string, en: string, code?: string, auto?: boolean) => `
<tr><td style="padding:0 0 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #B88A3B;background:#0B0B0D">
<tr><td width="64" align="center" style="font-family:Georgia,serif;font-size:34px;color:#D6B25E;padding:18px 0">${n}</td>
<td align="center" style="padding:16px 16px 16px 0;text-align:center">
<div style="font-family:Georgia,Tahoma,serif;font-size:19px;color:#F5F1E8" dir="rtl">${titleAr}</div>
<div style="font-size:12px;letter-spacing:2px;color:#D6B25E;text-transform:uppercase;margin:2px 0 8px">${titleEn}</div>
<div style="font-size:13px;line-height:1.7;color:#cfc8b8" dir="rtl">${ar}</div>
<div style="font-size:13px;line-height:1.6;color:#9d978a;margin-top:4px">${en}</div>
<div style="margin-top:10px;font-size:12px;color:#9d978a">${code ? `الكود / Code: ${chip(code)}` : auto ? "يتطبق تلقائيًا في السلة · Applied automatically in your cart" : ""}</div>
</td></tr></table></td></tr>`;
  return `<div style="background:#0B0B0D;padding:24px 12px;font-family:Arial,Tahoma,sans-serif;color:#F5F1E8">
<table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:auto;background:#121214;border:1px solid #B88A3B">
<tr><td align="center" style="padding:30px 24px 6px">
<div style="font-family:Georgia,serif;color:#D6B25E;letter-spacing:8px;font-size:26px">AURA</div>
<div style="height:1px;background:linear-gradient(90deg,transparent,#D6B25E,transparent);margin:18px 0 0"></div></td></tr>
<tr><td align="center" style="padding:18px 24px 4px">
<div style="font-size:11px;letter-spacing:5px;color:#D6B25E">✦ LIMITED-TIME CAMPAIGN ✦</div>
<div style="font-family:Georgia,serif;font-size:46px;line-height:1.1;color:#D6B25E;margin:12px 0 6px">Golden Friday</div>
<div style="font-size:22px;color:#F5F1E8;font-family:Georgia,Tahoma,serif" dir="rtl">الجمعة الذهبية بدأت</div>
</td></tr>
<tr><td style="padding:14px 28px 4px;text-align:center;font-size:14px;line-height:1.8;color:#cfc8b8">
<div dir="rtl">${hello ? `أهلاً ${esc(hello)}،` : "أهلاً بيك،"} ٣ عروض حصرية على عطور AURA${untilAr ? ` حتى ${untilAr}` : ""}. اختار زجاجاتك بنفسك — نفس الرائحة أو روائح مختلفة، زي ما تحب.</div>
<div style="color:#9d978a;margin-top:6px;font-size:13px">${hello ? `Hi ${esc(hello)} — ` : ""}three exclusive offers on AURA fragrances${until ? ` until ${until}` : ""}. Pick your bottles — same scent or mix them, your choice.</div>
</td></tr>
<tr><td style="padding:18px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${a ? card("2+1", "زجاجتين 100ML + زجاجة 50ML هدية", "2 × 100ML + 50ML free", "اطلب زجاجتين 100ML وخد زجاجة 50ML مجانًا.", "Buy two 100ML bottles and get a 50ML on us.", a.code) : ""}
${b ? card("3×50", "٣ زجاجات 50ML — الثالثة بنص السعر", "3 × 50ML — third at 50% off", "اطلب ٣ زجاجات 50ML والثالثة بخصم 50%.", "Take three 50ML bottles — the third is half price.", b.code) : ""}
${card("7×5", "باكيدج الجيب — ٣٥٠ ج.م", "The Pocket Pack — 350 EGP", "٧ زجاجات 5ML، كل زجاجة رائحة مختلفة من تشكيلتنا.", "Seven 5ML bottles — one of every scent we make.", undefined, true)}
</table></td></tr>
<tr><td align="center" style="padding:10px 24px 8px">
<a href="${link}" style="display:inline-block;background:#D6B25E;color:#0B0B0D;padding:15px 38px;text-decoration:none;letter-spacing:3px;font-weight:bold;font-size:13px">SHOP THE OFFERS · تسوّق العروض</a>
</td></tr>
<tr><td align="center" style="padding:14px 28px 6px;font-size:12px;line-height:1.8;color:#cfc8b8">
<div style="border-top:1px solid #2a2a2e;padding-top:14px" dir="rtl">📸 صوّر أوردرك (٣ صور أو أكتر) وانشرها على بروفايلك واعمل منشن لصفحتنا، وخد زجاجة 5ML من اختيارك مع أوردرك الجاي. ✦</div>
<div style="color:#9d978a;margin-top:4px">Post 3+ photos of your order and tag our page — get a 5ML bottle of your choice with your next order.</div>
</td></tr>
<tr><td align="center" style="padding:16px 24px 26px;font-size:11px;color:#6f6a60">AURA Fragrances · Eau de Parfum, composed in Egypt<br>${SITE.replace(/^https?:\/\//, "")}</td></tr>
</table></div>`;
}
