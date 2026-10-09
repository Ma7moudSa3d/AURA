"use server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { sendEmail, lowStockHtml, OWNER } from "@/lib/email";
import { sendAbandonedReminders } from "@/lib/abandoned";
import { ORDER_STATUSES } from "@/lib/types";

/** Every admin mutation re-verifies owner + role + email-OTP cookie + aal2, then runs under the
 *  user's session so DB-level RLS (is_admin()) is enforced a second time. */

export async function updateOrderStatus(orderId: string, status: string, adminNote: string) {
  await requireAdmin();
  const p = z.object({ id: z.string().uuid(), status: z.enum(ORDER_STATUSES), note: z.string().max(1000) })
    .parse({ id: orderId, status, note: adminNote });
  const sb = supabaseServer();
  const { data: before } = await sb.from("orders").select("status").eq("id", p.id).single();
  const { error } = await sb.from("orders").update({ status: p.status, admin_note: p.note || null }).eq("id", p.id);
  if (error) throw new Error("update failed");
  await sb.from("order_events").insert({ order_id: p.id, event_type: "STATUS", message: `${before?.status} -> ${p.status}` });

  if (p.status === "CANCELED" || p.status === "REFUNDED") await sb.rpc("restore_stock", { p_order: p.id });

  if (p.status === "PAID" || p.status === "CONFIRMED") {
    const { data: items } = await sb.from("order_items").select("products(title_en, stock_qty, low_stock_threshold)").eq("order_id", p.id);
    for (const i of (items ?? []) as any[]) {
      const pr = i.products;
      if (pr && pr.stock_qty <= pr.low_stock_threshold) await sendEmail(OWNER, `Low stock: ${pr.title_en}`, lowStockHtml(pr.title_en, pr.stock_qty));
    }
  }
  revalidatePath("/admin", "layout");
}

export async function getProofUrl(path: string): Promise<string | null> {
  await requireAdmin();
  const { data } = await supabaseService().storage.from("payment-proofs").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));
const list = (v: FormDataEntryValue | null) => String(v ?? "").split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);
const productSchema = z.object({
  title_en: z.string().trim().min(1).max(120), title_ar: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(100),
  description_en: z.string().max(4000), description_ar: z.string().max(4000),
  price: z.number().min(0), discount_price: z.number().min(0).nullable(), discount_percent: z.number().min(0).max(100).nullable(),
  discount_start: z.string().nullable(), discount_end: z.string().nullable(),
  stock_qty: z.number().int().min(0), low_stock_threshold: z.number().int().min(0),
  is_active: z.boolean(), is_featured: z.boolean(),
  gender: z.enum(["unisex", "men", "women"]), collection: z.string().max(80).nullable(),
  tags: z.array(z.string()), volume: z.string().max(20), concentration: z.string().max(20),
});

export async function saveProduct(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const id = (fd.get("id") as string) || null;
  const parsed = productSchema.safeParse({
    title_en: fd.get("title_en"), title_ar: fd.get("title_ar"), slug: fd.get("slug"),
    description_en: fd.get("description_en") ?? "", description_ar: fd.get("description_ar") ?? "",
    price: num(fd.get("price")), discount_price: num(fd.get("discount_price")), discount_percent: num(fd.get("discount_percent")),
    discount_start: (fd.get("discount_start") as string) || null, discount_end: (fd.get("discount_end") as string) || null,
    stock_qty: num(fd.get("stock_qty")), low_stock_threshold: num(fd.get("low_stock_threshold")),
    is_active: fd.get("is_active") === "on", is_featured: fd.get("is_featured") === "on",
    gender: fd.get("gender"), collection: (fd.get("collection") as string) || null, tags: list(fd.get("tags")),
    volume: fd.get("volume") ?? "50ml", concentration: fd.get("concentration") ?? "EDP",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.path.join(".") + ": " + parsed.error.issues[0]?.message };
  const sb = supabaseServer();
  const res = id ? await sb.from("products").update(parsed.data).eq("id", id).select("id").single()
                 : await sb.from("products").insert(parsed.data).select("id").single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message };
  const pid = res.data.id;

  await sb.from("product_notes").upsert({ product_id: pid, top_notes: list(fd.get("top_notes")), heart_notes: list(fd.get("heart_notes")), base_notes: list(fd.get("base_notes")) });

  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const { count } = await sb.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", pid);
  let order = count ?? 0;
  for (const f of files) {
    if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024) continue;
    const path = `${pid}/${randomUUID()}.${f.type.split("/")[1]}`;
    const up = await sb.storage.from("product-images").upload(path, f, { contentType: f.type });
    if (!up.error) await sb.from("product_images").insert({ product_id: pid, path, sort_order: order++ });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  const sb = supabaseServer();
  const { data } = await sb.from("product_images").select("path").eq("id", imageId).single();
  if (data) await sb.storage.from("product-images").remove([data.path]);
  await sb.from("product_images").delete().eq("id", imageId);
  revalidatePath("/", "layout");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const sb = supabaseServer();
  const { error } = await sb.from("products").delete().eq("id", z.string().uuid().parse(id));
  // products referenced by past orders cannot be deleted: deactivate instead
  if (error) await sb.from("products").update({ is_active: false }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function saveCoupon(fd: FormData) {
  await requireAdmin();
  const p = z.object({
    code: z.string().trim().min(3).max(30).transform((s) => s.toUpperCase()), type: z.enum(["percent", "fixed"]),
    value: z.number().positive(), expires_at: z.string().nullable(), max_uses: z.number().int().positive().nullable(),
  }).parse({ code: fd.get("code"), type: fd.get("type"), value: num(fd.get("value")), expires_at: (fd.get("expires_at") as string) || null, max_uses: num(fd.get("max_uses")) });
  await supabaseServer().from("coupons").upsert(p, { onConflict: "code" });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await supabaseServer().from("coupons").delete().eq("id", id);
  revalidatePath("/admin/coupons");
}

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const s = (k: string) => ((fd.get(k) as string) || null);
  const p = z.object({ whatsapp_number: z.string().regex(/^\+?\d{8,15}$/), shipping_fee: z.number().min(0), free_shipping_threshold: z.number().min(0) })
    .parse({ whatsapp_number: String(fd.get("whatsapp_number")).replace(/\s/g, ""), shipping_fee: num(fd.get("shipping_fee")), free_shipping_threshold: num(fd.get("free_shipping_threshold")) });
  await supabaseServer().from("settings").update({
    ...p, instagram: s("instagram"), facebook: s("facebook"), tiktok: s("tiktok"),
    contact_email: s("contact_email"), contact_phone: s("contact_phone"), announcement_en: s("announcement_en"), announcement_ar: s("announcement_ar"),
  }).eq("id", 1);
  revalidatePath("/", "layout");
}

export async function sendRemindersNow() {
  await requireAdmin();
  return sendAbandonedReminders();
}

export async function moderateReview(id: string, approve: boolean) {
  await requireAdmin();
  const sb = supabaseServer();
  if (approve) await sb.from("reviews").update({ is_approved: true }).eq("id", id);
  else await sb.from("reviews").delete().eq("id", id);
  revalidatePath("/admin/reviews");
}
