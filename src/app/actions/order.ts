"use server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, orderEmailHtml, OWNER, type OrderEmailData } from "@/lib/email";

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().regex(/^[+0-9\s-]{8,20}$/),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  transaction_reference_id: z.string().trim().max(80).optional().or(z.literal("")),
  coupon: z.string().trim().max(40).optional().or(z.literal("")),
  items: z.array(z.object({ product_id: z.string().uuid(), qty: z.number().int().min(1).max(20) })).min(1).max(30),
});

const MAX_PROOF = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function createOrder(fd: FormData): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !user.email) return { ok: false, error: "AUTH_REQUIRED" };
  if (!rateLimit(`order:${user.id}`, 5, 10 * 60_000)) return { ok: false, error: "RATE_LIMITED" };

  let parsed;
  try {
    parsed = schema.parse({
      customer_name: fd.get("customer_name"), customer_phone: fd.get("customer_phone"),
      address_line1: fd.get("address_line1"), address_line2: fd.get("address_line2") ?? "",
      city: fd.get("city"), notes: fd.get("notes") ?? "",
      transaction_reference_id: fd.get("transaction_reference_id") ?? "", coupon: fd.get("coupon") ?? "",
      items: JSON.parse(String(fd.get("items") ?? "[]")),
    });
  } catch { return { ok: false, error: "INVALID_INPUT" }; }

  // Merge duplicate product lines
  const merged = new Map<string, number>();
  for (const i of parsed.items) merged.set(i.product_id, Math.min(20, (merged.get(i.product_id) ?? 0) + i.qty));
  const items = [...merged].map(([product_id, qty]) => ({ product_id, qty }));

  // Payment proof (optional if txn ref given)
  let proofPath: string | null = null;
  const file = fd.get("payment_proof");
  if (file instanceof File && file.size > 0) {
    const ext = TYPES[file.type];
    if (!ext || file.size > MAX_PROOF) return { ok: false, error: "INVALID_FILE" };
    proofPath = `${user.id}/${randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("payment-proofs").upload(proofPath, file, { contentType: file.type });
    if (error) return { ok: false, error: "UPLOAD_FAILED" };
  }
  if (!parsed.transaction_reference_id && !proofPath) return { ok: false, error: "PROOF_REQUIRED" };

  const svc = supabaseService();
  const { data: orderId, error } = await svc.rpc("create_order", {
    p_user_id: user.id, p_email: user.email, p_name: parsed.customer_name, p_phone: parsed.customer_phone,
    p_address1: parsed.address_line1, p_address2: parsed.address_line2 || null, p_city: parsed.city,
    p_notes: parsed.notes || null, p_txn_ref: parsed.transaction_reference_id || null,
    p_proof_path: proofPath, p_coupon: parsed.coupon || null, p_items: items,
  });
  if (error || !orderId) {
    if (proofPath) await svc.storage.from("payment-proofs").remove([proofPath]);
    const m = error?.message ?? "";
    return { ok: false, error: m.includes("insufficient stock") ? "OUT_OF_STOCK" : m.includes("coupon") ? "BAD_COUPON" : "ORDER_FAILED" };
  }

  // Emails (never block the order on mail failure)
  try {
    const { data: o } = await svc.from("orders").select("*, order_items(*)").eq("id", orderId).single();
    if (o) {
      let proof_url: string | null = null;
      if (o.payment_proof_path) {
        const s = await svc.storage.from("payment-proofs").createSignedUrl(o.payment_proof_path, 7 * 24 * 3600);
        proof_url = s.data?.signedUrl ?? null;
      }
      const data: OrderEmailData = { ...o, items: o.order_items, proof_url };
      await Promise.allSettled([
        sendEmail(OWNER, `New AURA order ${o.id.slice(0, 8).toUpperCase()} — ${o.total} EGP`, orderEmailHtml(data, true)),
        sendEmail(o.customer_email, "Your AURA order confirmation", orderEmailHtml(data, false)),
      ]);
    }
  } catch (e) { console.error("order email failed", e); }

  return { ok: true, orderId };
}
