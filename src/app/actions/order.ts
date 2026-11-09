"use server";

import { supabaseService } from "@/lib/supabase/server";
import { getUser } from "@/lib/data";
import { sendEmailDetailed, orderEmailHtml, OWNER, type OrderEmailData } from "@/lib/email";
import { normVolume, pickVariant } from "@/lib/variants";
import { couponDiscount, couponProblem } from "@/lib/coupon";
import { toOfferLines, pocketPackDiscount } from "@/lib/offers";
import { getCampaign } from "@/lib/campaign";

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });

const PAYMENT_METHODS = ["COD", "INSTAPAY", "DEPOSIT"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Creates an order.
 * Everything that costs money is recomputed here from the database; the browser's totals are ignored.
 * Field names match CheckoutForm: full_name, phone, governorate, address_details, payment_method,
 * items (JSON [{product_id, volume, quantity}]), coupon_code, proof (file).
 */
export async function createOrder(formData: FormData): Promise<{ ok: true; orderId: string } | Fail> {
  try {
    const user = await getUser();
    if (!user) return fail("يرجى تسجيل الدخول أولاً / Please sign in first");

    const text = (k: string, max = 300) => String(formData.get(k) ?? "").trim().slice(0, max);

    const customer_name = text("full_name", 100);
    const customer_phone = text("phone", 20);
    const city = text("governorate", 100);
    const address_line1 = text("address_details", 300);
    const notes = text("notes", 500) || null;
    const couponCode = text("coupon_code", 40).toUpperCase();
    const methodRaw = text("payment_method", 20).toUpperCase();
    const payment_method: PaymentMethod = (PAYMENT_METHODS as readonly string[]).includes(methodRaw)
      ? (methodRaw as PaymentMethod)
      : "INSTAPAY";

    if (customer_name.length < 2 || customer_phone.length < 8 || !city || address_line1.length < 5) {
      return fail("يرجى إكمال بيانات الشحن / Please complete the shipping details");
    }

    const file = formData.get("proof");
    const proof = file instanceof File && file.size > 0 ? file : null;
    if (payment_method !== "COD" && !proof) return fail("يرجى إرفاق إيصال التحويل / Please upload the transfer receipt");
    if (proof && (proof.size > 5 * 1024 * 1024 || !proof.type.startsWith("image/"))) {
      return fail("يجب أن يكون الإيصال صورة بحجم أقل من 5MB / Receipt must be an image under 5MB");
    }

    // ── Items ─────────────────────────────────────────────
    let rawItems: any[] = [];
    try {
      rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
    } catch {
      return fail("بيانات السلة غير صالحة / Invalid cart");
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) return fail("السلة فارغة / Cart is empty");
    if (rawItems.length > 30) return fail("عدد المنتجات كبير / Too many items");

    const wanted = rawItems.map((i) => ({
      product_id: String(i?.product_id ?? ""),
      volume: normVolume(i?.volume),
      qty: Math.min(20, Math.max(1, Math.floor(Number(i?.quantity ?? i?.qty ?? 1)) || 1)),
    }));

    const sb = supabaseService();
    const ids = Array.from(new Set(wanted.map((w) => w.product_id)));
    const { data: products, error: prodErr } = await sb
      .from("products")
      .select("*")
      .in("id", ids);
    if (prodErr || !products?.length) {
      console.error("[order] products lookup failed", prodErr);
      return fail("تعذر تحميل المنتجات / Could not load products");
    }
    const byId = new Map(products.map((p: any) => [p.id, p]));

    // stock check per product (all sizes of one product share the same stock)
    const perProduct = new Map<string, number>();
    for (const w of wanted) perProduct.set(w.product_id, (perProduct.get(w.product_id) ?? 0) + w.qty);
    for (const [pid, qty] of perProduct) {
      const p: any = byId.get(pid);
      if (!p || p.is_active === false) return fail("أحد المنتجات غير متاح / A product is no longer available");
      if (Number(p.stock_qty) < qty) return fail(`الكمية المتاحة من ${p.title_en} غير كافية / Not enough stock for ${p.title_en}`);
    }

    let subtotal = 0;
    const lines = wanted.map((w) => {
      const p: any = byId.get(w.product_id);
      const variant = pickVariant(p, w.volume);
      const unit = variant.price;
      const line_total = unit * w.qty;
      subtotal += line_total;
      return {
        product_id: w.product_id,
        product_title_snapshot: `${p.title_en} (${variant.volume})`,
        price: unit,
        qty: w.qty,
        line_total,
      };
    });

    // ── Offers, coupon + shipping ─────────────────────────
    const { data: settings } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
    const offerLines = toOfferLines(wanted, byId);
    // Pocket Pack is a campaign offer: applied automatically while the campaign is live.
    const pack = getCampaign(settings) ? pocketPackDiscount(offerLines) : { discount: 0, sets: 0 };
    const afterPack = Math.max(0, subtotal - pack.discount);

    let couponOnly = 0;
    let freeShip = false;
    let appliedCode: string | null = null;
    let couponRow: any = null;
    if (couponCode) {
      const { data: c } = await sb.from("coupons").select("*").ilike("code", couponCode).eq("is_active", true).maybeSingle();
      if (!c) return fail("كود الخصم غير صالح / Invalid coupon");
      const problem = couponProblem(c, afterPack, offerLines);
      if (problem) return fail(problem);
      if (c.first_order_only) {
        const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id);
        if (count && count > 0) return fail("الكود للطلب الأول فقط / Coupon is for the first order only");
      }
      couponRow = c;
      couponOnly = couponDiscount(c, afterPack, offerLines);
      freeShip = Boolean(c.free_shipping);
      appliedCode = c.code;
    }
    const discount = Math.round((pack.discount + couponOnly) * 100) / 100;

    const shippingFee = Number(settings?.shipping_fee ?? 60);
    const freeThreshold = Number(settings?.free_shipping_threshold ?? 2000);
    const net = Math.max(0, subtotal - discount);
    const shipping_fee = freeShip || net >= freeThreshold ? 0 : shippingFee;
    const total = Math.round((net + shipping_fee) * 100) / 100;

    // ── Payment proof (private bucket, path = <user_id>/<file>) ──
    let payment_proof_path: string | null = null;
    if (proof) {
      const ext = (proof.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const path = `${user.id}/proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await sb.storage
        .from("payment-proofs")
        .upload(path, Buffer.from(await proof.arrayBuffer()), { contentType: proof.type || "image/jpeg", upsert: false });
      if (upErr) {
        console.error("[order] proof upload failed", upErr);
        return fail("تعذر رفع الإيصال، حاول مرة أخرى / Could not upload the receipt, please try again");
      }
      payment_proof_path = path;
    }

    // DB constraint requires a proof OR a reference; cash orders carry a marker.
    const transaction_reference_id = payment_proof_path ? null : "COD";

    const depositAmount = payment_method === "DEPOSIT" ? Math.round(total * 0.25) : 0;
    let orderNotes = notes;
    if (pack.sets > 0) {
      const line = `Pocket Pack offer x${pack.sets}: -${pack.discount} EGP`;
      orderNotes = orderNotes ? `${orderNotes}\n${line}` : line;
    }
    if (payment_method === "DEPOSIT") {
      const line = `Deposit 25%: ${depositAmount} EGP paid, ${total - depositAmount} EGP due on delivery`;
      orderNotes = orderNotes ? `${orderNotes}\n${line}` : line;
    }

    // ── Insert order + items ──────────────────────────────
    const { data: order, error: orderErr } = await sb
      .from("orders")
      .insert({
        user_id: user.id,
        status: "PENDING_PAYMENT_VERIFICATION",
        subtotal,
        discount,
        discount_total: discount,
        coupon_code: appliedCode,
        shipping_fee,
        total,
        customer_name,
        customer_email: user.email ?? OWNER,
        customer_phone,
        address_line1,
        city,
        notes: orderNotes,
        payment_method,
        transaction_reference_id,
        payment_proof_path,
        deposit_amount: depositAmount,
        remaining_balance: payment_method === "DEPOSIT" ? total - depositAmount : 0,
      })
      .select("id, created_at")
      .single();

    if (orderErr || !order) {
      console.error("[order] insert failed", orderErr);
      return fail(`تعذر إنشاء الطلب / Could not create order${orderErr?.message ? `: ${orderErr.message}` : ""}`);
    }

    const { error: itemsErr } = await sb.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsErr) {
      console.error("[order] items insert failed", itemsErr);
      await sb.from("orders").delete().eq("id", order.id);
      return fail(`تعذر حفظ عناصر الطلب / Could not save order items: ${itemsErr.message}`);
    }

    // stock + coupon usage (best effort; the order itself is already safe)
    for (const [pid, qty] of perProduct) {
      const cur = Number((byId.get(pid) as any).stock_qty);
      await sb.from("products").update({ stock_qty: Math.max(0, cur - qty) }).eq("id", pid).eq("stock_qty", cur);
    }
    if (couponRow) {
      await sb.from("coupons").update({ used_count: Number(couponRow.used_count ?? 0) + 1 }).eq("id", couponRow.id);
    }
    await sb.from("order_events").insert({ order_id: order.id, event_type: "CREATED", message: "Order placed, pending payment verification" });
    await sb.from("cart_items").delete().in("cart_id", (await sb.from("carts").select("id").eq("user_id", user.id)).data?.map((c: any) => c.id) ?? []);

    // ── Emails: never block or fail the order ─────────────
    try {
      let proof_url: string | null = null;
      if (payment_proof_path) {
        const { data: signed } = await sb.storage.from("payment-proofs").createSignedUrl(payment_proof_path, 7 * 24 * 3600);
        proof_url = signed?.signedUrl ?? null;
      }
      const data: OrderEmailData = {
        id: order.id,
        created_at: order.created_at,
        customer_name,
        customer_email: user.email ?? "",
        customer_phone,
        address_line1,
        address_line2: null,
        city,
        notes: orderNotes,
        subtotal,
        discount_total: discount,
        shipping_fee,
        total,
        payment_method,
        transaction_reference_id,
        proof_url,
        items: lines.map((l) => ({
          product_title_snapshot: l.product_title_snapshot,
          qty: l.qty,
          unit_price_snapshot: l.price,
          discount_snapshot: 0,
          line_total: l.line_total,
        })),
      };
      const short = order.id.slice(0, 8).toUpperCase();
      const results = await Promise.all([
        sendEmailDetailed(OWNER, `New AURA order #${short} (${payment_method}) - ${total} EGP`, orderEmailHtml(data, true)),
        user.email
          ? sendEmailDetailed(user.email, `Your AURA order #${short}`, orderEmailHtml(data, false))
          : Promise.resolve({ ok: false, error: "customer has no email" }),
      ]);
      results.forEach((r, i) => {
        if (!r.ok) console.error(`[order] ${i === 0 ? "owner" : "customer"} email NOT sent for #${short}:`, r.error);
      });
    } catch (e) {
      console.error("[order] email step crashed", e);
    }

    return { ok: true, orderId: order.id };
  } catch (err) {
    console.error("[order] unexpected error", err);
    return fail(err instanceof Error ? err.message : "SERVER_ERROR");
  }
}
