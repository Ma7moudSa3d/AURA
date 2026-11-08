"use server";
import { z } from "zod";
import { cairoLocalToIso } from "@/lib/campaign";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { sendEmail, sendEmailDetailed, lowStockHtml, OWNER } from "@/lib/email";
import { sendAbandonedReminders } from "@/lib/abandoned";
import { ORDER_STATUSES } from "@/lib/types";

export async function updateOrderStatus(orderId: string, status: string, adminNote: string) {
  await requireAdmin();
  const p = z.object({ id: z.string().uuid(), status: z.enum(ORDER_STATUSES), note: z.string().max(1000) })
    .parse({ id: orderId, status, note: adminNote });
  const sb = supabaseServer();
  const { data: before } = await sb.from("orders").select("status").eq("id", p.id).single();
  const { error } = await sb.from("orders").update({ status: p.status, admin_note: p.note || null }).eq("id", p.id);
  if (error) throw new Error("update failed");
  await sb.from("order_events").insert({ order_id: p.id, event_type: "STATUS", message: `${before?.status} -> ${p.status}` });

  // Stock follows the order: cancelling/refunding puts the units back, re-opening takes them out again.
  const DEAD = ["CANCELED", "CANCELLED", "REFUNDED"];
  const wasDead = DEAD.includes(String(before?.status ?? "").toUpperCase());
  const isDead = DEAD.includes(p.status);
  if (wasDead !== isDead) {
    const svc = supabaseService();
    const { data: lines } = await svc.from("order_items").select("product_id, qty").eq("order_id", p.id);
    const perProduct = new Map<string, number>();
    for (const l of lines ?? []) if (l.product_id) perProduct.set(l.product_id, (perProduct.get(l.product_id) ?? 0) + Number(l.qty));
    for (const [pid, qty] of perProduct) {
      const { data: pr } = await svc.from("products").select("stock_qty").eq("id", pid).maybeSingle();
      if (pr) await svc.from("products").update({ stock_qty: Math.max(0, Number(pr.stock_qty) + (isDead ? qty : -qty)) }).eq("id", pid);
    }
  }

  // Tell the customer when their order moves forward (never blocks the update).
  const customerMsg: Record<string, string> = {
    CONFIRMED: "Your order is confirmed and being prepared.",
    PAID: "We have verified your payment. Thank you!",
    SHIPPED: "Your order is on its way to you.",
    DELIVERED: "Your order has been delivered. We hope you love it!",
    CANCELED: "Your order was cancelled. Contact us if you have any questions.",
  };
  if (customerMsg[p.status] && before?.status !== p.status) {
    try {
      const { data: o } = await supabaseService().from("orders").select("customer_email").eq("id", p.id).maybeSingle();
      if (o?.customer_email) {
        const short = p.id.slice(0, 8).toUpperCase();
        await sendEmailDetailed(o.customer_email, `AURA order #${short}: ${p.status.replace(/_/g, " ").toLowerCase()}`,
          `<div style="font-family:Arial,sans-serif;background:#0B0B0D;color:#F5F1E8;padding:24px"><h2 style="color:#D6B25E;letter-spacing:3px">AURA</h2><p>${customerMsg[p.status]}</p><p style="color:#D6B25E">Order #${short}</p></div>`);
      }
    } catch (e) { console.error("[admin] status email failed", e); }
  }

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
  title_en: z.string().trim().min(1).max(120),
  title_ar: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(100),
  description_en: z.string().max(4000),
  description_ar: z.string().max(4000),
  price: z.number().min(0),
  discount_price: z.number().min(0).nullable(),
  discount_percent: z.number().min(0).max(100).nullable(),
  discount_start: z.string().nullable(),
  discount_end: z.string().nullable(),
  stock_qty: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  gender: z.enum(["unisex", "men", "women"]),
  collection: z.string().max(80).nullable(),
  tags: z.array(z.string()),
  volume: z.string().max(20),
  concentration: z.string().max(20),
});

export async function saveProduct(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const id = (fd.get("id") as string) || null;

    let variants: any[] = [];
    try {
      const rawVariants = fd.get("variants") as string;
      if (rawVariants) variants = JSON.parse(rawVariants);
    } catch (e) {
      console.error("Variants parse error:", e);
    }

    const parsed = productSchema.safeParse({
      title_en: fd.get("title_en"),
      title_ar: fd.get("title_ar"),
      slug: fd.get("slug"),
      description_en: fd.get("description_en") ?? "",
      description_ar: fd.get("description_ar") ?? "",
      price: num(fd.get("price")),
      discount_price: num(fd.get("discount_price")),
      discount_percent: num(fd.get("discount_percent")),
      discount_start: (fd.get("discount_start") as string) || null,
      discount_end: (fd.get("discount_end") as string) || null,
      stock_qty: num(fd.get("stock_qty")),
      low_stock_threshold: num(fd.get("low_stock_threshold")),
      is_active: fd.get("is_active") === "on",
      is_featured: fd.get("is_featured") === "on",
      gender: fd.get("gender"),
      collection: (fd.get("collection") as string) || null,
      tags: list(fd.get("tags")),
      volume: (fd.get("volume") as string) || "50ml",
      concentration: (fd.get("concentration") as string) || "EDP",
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { ok: false, error: `${firstError?.path.join(".")}: ${firstError?.message}` };
    }

    const payload = {
      ...parsed.data,
      variants,
    };

    const sb = supabaseServer();
    const write = (body: Record<string, unknown>) =>
      id
        ? sb.from("products").update(body).eq("id", id).select("id").single()
        : sb.from("products").insert(body).select("id").single();
    let res = await write(payload);
    // Databases created from the original migration have no products.variants column: retry without it.
    if (res.error && /variants/i.test(res.error.message)) {
      const { variants: _omit, ...rest } = payload;
      res = await write(rest);
    }

    if (res.error || !res.data) {
      return { ok: false, error: res.error?.message || "Failed to save product in DB" };
    }

    const pid = res.data.id;

    await sb.from("product_notes").upsert({
      product_id: pid,
      top_notes: list(fd.get("top_notes")),
      heart_notes: list(fd.get("heart_notes")),
      base_notes: list(fd.get("base_notes")),
    });

    const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    const { count } = await sb.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", pid);
    let order = count ?? 0;
    for (const f of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024) continue;
      const path = `${pid}/${randomUUID()}.${f.type.split("/")[1]}`;
      const up = await sb.storage.from("product-images").upload(path, f, { contentType: f.type });
      if (!up.error) {
        const image_url = sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        await sb.from("product_images").insert({ product_id: pid, path, image_url, sort_order: order, order_index: order, is_main: order === 0 });
        order++;
      }
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err: any) {
    console.error("saveProduct error:", err);
    return { ok: false, error: err?.message || "An unexpected error occurred" };
  }
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

export async function saveSettings(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const s = (k: string) => {
      const v = fd.get(k);
      return v !== null && v !== undefined && String(v).trim() !== "" ? String(v).trim() : null;
    };

    const enable_cod = fd.get("enable_cod") !== null;
    const enable_instapay = fd.get("enable_instapay") !== null;
    const enable_deposit = fd.get("enable_deposit") !== null;

    const rawWhatsapp = String(fd.get("whatsapp_number") ?? "").replace(/\s/g, "");
    const shippingFee = num(fd.get("shipping_fee")) ?? 60;
    const freeThreshold = num(fd.get("free_shipping_threshold")) ?? 2000;

    const instagramVal = s("instagram_url") || s("instagram");
    const facebookVal = s("facebook_url") || s("facebook");
    const tiktokVal = s("tiktok_url") || s("tiktok");

    const sb = supabaseService();

    // Campaign artwork is uploaded straight from the browser to Storage (see createCampaignUpload);
    // here we only accept the resulting public URL, or clear it when "remove" is ticked.
    const images: Record<string, string | null> = {};
    const publicPrefix = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")}/storage/v1/object/public/product-images/campaign/`;
    for (const key of ["offer_image_100", "offer_image_50", "offer_image_pack"]) {
      const v = fd.get(key);
      if (typeof v === "string" && v.startsWith(publicPrefix)) images[key] = v;
      else if (fd.get(`remove_${key}`) !== null) images[key] = null;
    }

    const stamp = new Date().toISOString();
    const { error } = await sb.from("settings").upsert({
      ...images,
      id: 1,
      whatsapp_number: rawWhatsapp || null,
      shipping_fee: shippingFee,
      free_shipping_threshold: freeThreshold,
      instagram: instagramVal,
      instagram_url: instagramVal,
      facebook: facebookVal,
      facebook_url: facebookVal,
      tiktok: tiktokVal,
      tiktok_url: tiktokVal,
      contact_email: s("contact_email") || "aurafragrances111@gmail.com",
      contact_phone: s("contact_phone"),
      announcement_en: s("announcement_en"),
      announcement_ar: s("announcement_ar"),
      enable_cod,
      enable_instapay,
      enable_deposit,
      campaign_active: fd.get("campaign_active") !== null,
      campaign_ends_at: cairoLocalToIso(s("campaign_ends_at")),
      campaign_code: s("campaign_code")?.toUpperCase().replace(/[^A-Z0-9_-]/g, "") || null,
      campaign_headline_en: s("campaign_headline_en"),
      campaign_headline_ar: s("campaign_headline_ar"),
      updated_at: stamp,
    }, { onConflict: "id" });

    if (error) {
      console.error("Save settings DB error:", error);
      return { ok: false, error: error.message };
    }

    // Make sure the row really changed (a silent no-op must never be reported as "saved").
    const { data: check } = await sb.from("settings").select("updated_at").eq("id", 1).maybeSingle();
    if (!check || new Date(check.updated_at).getTime() !== new Date(stamp).getTime()) {
      return { ok: false, error: "Settings were not written to the database. Please try again." };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");

    return { ok: true };
  } catch (err: any) {
    console.error("saveSettings exception:", err);
    return { ok: false, error: err?.message || "Failed to save settings" };
  }
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

// ── Coupons (used by the admin coupons page; every call is admin-gated and runs server-side) ──
export async function adminListCoupons() {
  await requireAdmin();
  const { data } = await supabaseService().from("coupons").select("*").order("code");
  return data ?? [];
}

export async function adminCreateCoupon(input: {
  code: string; type: "percent" | "fixed" | "BUNDLE_2X100_FREE50" | "BUNDLE_2X50_THIRD_HALF"; value: number; expires_at: string | null; max_uses: number | null;
  free_shipping: boolean; first_order_only: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const p = z.object({
    code: z.string().trim().min(3).max(30).transform((s) => s.toUpperCase()),
    type: z.enum(["percent", "fixed", "BUNDLE_2X100_FREE50", "BUNDLE_2X50_THIRD_HALF"]),
    value: z.number().min(0).max(100000),
    expires_at: z.string().nullable(),
    max_uses: z.number().int().positive().nullable(),
    free_shipping: z.boolean(),
    first_order_only: z.boolean(),
  }).safeParse(input);
  if (!p.success) return { ok: false, error: "Invalid coupon data" };
  const isBundle = p.data.type.startsWith("BUNDLE_");
  if (!isBundle && p.data.value <= 0) return { ok: false, error: "Value must be greater than 0" };

  const sb = supabaseService();
  const base = { code: p.data.code, type: p.data.type, value: p.data.value, discount_percent: p.data.type === "percent" ? p.data.value : 0, discount_amount: p.data.type === "fixed" ? p.data.value : 0, expires_at: p.data.expires_at, max_uses: p.data.max_uses, is_active: true };
  // Newer columns exist on some databases only; fall back to the base schema if they do not.
  let { error } = await sb.from("coupons").insert({ ...base, free_shipping: p.data.free_shipping, first_order_only: p.data.first_order_only });
  if (error && /column|schema cache/i.test(error.message)) ({ error } = await sb.from("coupons").insert(base));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function adminDeleteCoupon(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const { error } = await supabaseService().from("coupons").delete().eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function adminToggleCoupon(id: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const { error } = await supabaseService().from("coupons").update({ is_active: active }).eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/coupons");
  return { ok: true };
}

/** Signed upload slot so the browser can send a (large) image straight to Storage, bypassing the server-action body limit. */
export async function createCampaignUpload(key: string, filename: string): Promise<{ ok: true; path: string; token: string; url: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!["offer_image_100", "offer_image_50", "offer_image_pack"].includes(key)) return { ok: false, error: "Unknown image slot" };
    const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `campaign/${key}-${Date.now()}.${ext}`;
    const sb = supabaseService();
    const { data, error } = await sb.storage.from("product-images").createSignedUploadUrl(path);
    if (error || !data) return { ok: false, error: error?.message || "Could not prepare upload" };
    return { ok: true, path, token: data.token, url: sb.storage.from("product-images").getPublicUrl(path).data.publicUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Upload failed" };
  }
}
