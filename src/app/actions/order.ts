"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/data";

// ──────────────────────────────────────────────
// Helper: Send order notification email via Brevo
// ──────────────────────────────────────────────
async function sendOrderEmail({
  orderId,
  customerName,
  phone,
  total,
  address,
  city,
}: {
  orderId: string;
  customerName: string;
  phone: string;
  total: number;
  address: string;
  city: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("BREVO_API_KEY is missing – skipping email notification.");
    return;
  }

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "AURA Perfumes", email: "ofoftot@gmail.com" },
        to: [
          { email: "ofoftot@gmail.com", name: "AURA Admin" },
        ],
        subject: `🚨 طلب جديد في AURA – ${total} EGP (#${orderId.slice(0, 8)})`,
        htmlContent: `
          <div style="font-family:sans-serif;padding:24px;background:#0a0a0a;color:#D6B25E;max-width:560px;margin:0 auto;">
            <h2 style="margin:0 0 16px;font-size:22px;">✨ وصلك طلب جديد!</h2>
            <table style="width:100%;border-collapse:collapse;color:#f5f0e8;font-size:14px;">
              <tr><td style="padding:6px 0;opacity:.6;">رقم الطلب</td><td style="padding:6px 0;font-family:monospace;">${orderId}</td></tr>
              <tr><td style="padding:6px 0;opacity:.6;">الاسم</td><td style="padding:6px 0;">${customerName}</td></tr>
              <tr><td style="padding:6px 0;opacity:.6;">الهاتف</td><td style="padding:6px 0;" dir="ltr">${phone}</td></tr>
              <tr><td style="padding:6px 0;opacity:.6;">العنوان</td><td style="padding:6px 0;">${address}, ${city}</td></tr>
              <tr><td style="padding:6px 0;opacity:.6;">الإجمالي</td><td style="padding:6px 0;font-weight:bold;color:#D6B25E;">${total} EGP</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
            <p style="margin:0;font-size:13px;opacity:.7;">
              ادخل على لوحة التحكم 
              <a href="https://aura-perfume-weld.vercel.app/admin/orders" style="color:#D6B25E;">/admin/orders</a>
              لمعاينة صورة إيصال الدفع والموافقة على الطلب.
            </p>
          </div>
        `,
      }),
    });
  } catch (err) {
    // Never block the order if email fails
    console.error("Failed to send order email:", err);
  }
}

// ──────────────────────────────────────────────
// Main Server Action: createOrder
// ──────────────────────────────────────────────
export async function createOrder(formData: FormData) {
  try {
    // 1. Auth check
    const user = await getUser();
    if (!user) return { ok: false as const, error: "AUTH_REQUIRED" };

    // 2. Extract & sanitize fields
    const customer_name = (formData.get("customer_name") as string)?.trim() ?? "";
    const customer_phone = (formData.get("customer_phone") as string)?.trim() ?? "";
    const address_line1 = (formData.get("address_line1") as string)?.trim() ?? "";
    const address_line2 = (formData.get("address_line2") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() ?? "";
    const notes = (formData.get("notes") as string)?.trim() || null;
    const transaction_reference_id =
      (formData.get("transaction_reference_id") as string)?.trim() || null;

    // Coupon: ignore if empty / whitespace only
    const couponRaw = (formData.get("coupon") as string)?.trim() || "";
    const itemsRaw = formData.get("items") as string;
    const file = formData.get("payment_proof") as File | null;

    // 3. Must have either a transaction ref OR a proof image
    if (!transaction_reference_id && (!file || file.size === 0)) {
      return { ok: false as const, error: "PROOF_REQUIRED" };
    }

    // 4. Parse cart items
    let items: { product_id: string; qty: number }[] = [];
    try {
      items = JSON.parse(itemsRaw || "[]");
    } catch {
      return { ok: false as const, error: "INVALID_ITEMS" };
    }
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false as const, error: "EMPTY_CART" };
    }

    const sb = supabaseServer();

    // 5. Fetch product prices
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await sb
      .from("products")
      .select("id, price, discount_price, stock_qty")
      .in("id", productIds);

    if (prodErr || !products || products.length === 0) {
      console.error("Products fetch error:", prodErr);
      return { ok: false as const, error: "INVALID_PRODUCTS" };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItemsData: { product_id: string; qty: number; price: number }[] = [];

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) continue;

      const unitPrice = Number(prod.discount_price ?? prod.price) || 0;
      subtotal += unitPrice * item.qty;
      orderItemsData.push({
        product_id: item.product_id,
        qty: item.qty,
        price: unitPrice,
      });
    }

    if (orderItemsData.length === 0) {
      return { ok: false as const, error: "INVALID_PRODUCTS" };
    }

    // 6. Shipping fee from settings
    const { data: settings } = await sb
      .from("settings")
      .select("shipping_fee, free_shipping_threshold")
      .eq("id", 1)
      .maybeSingle();

    const shippingFee = Number(settings?.shipping_fee ?? 60);
    const freeThreshold = Number(settings?.free_shipping_threshold ?? 2000);
    const shipCost = subtotal >= freeThreshold ? 0 : shippingFee;

    // 7. Coupon check – ONLY if user typed something
    let discount = 0;
    let couponCode: string | null = null;

    if (couponRaw.length > 0) {
      const { data: couponData } = await sb
        .from("coupons")
        .select("code, discount_percent, discount_amount, is_active")
        .ilike("code", couponRaw)
        .eq("is_active", true)
        .maybeSingle();

      if (!couponData) {
        // Real bad coupon typed by user
        return { ok: false as const, error: "BAD_COUPON" };
      }

      couponCode = couponData.code;
      const percent = Number(couponData.discount_percent ?? 0);
      const amount = Number(couponData.discount_amount ?? 0);

      if (percent > 0) {
        discount = (subtotal * percent) / 100;
      } else if (amount > 0) {
        discount = amount;
      }
    }

    // 8. Upload payment proof image (if provided)
    let payment_proof_path: string | null = null;

    if (file && file.size > 0) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadErr } = await sb.storage
        .from("receipts")
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadErr) {
        console.error("Proof upload error:", uploadErr);
        // Don't fail the whole order just because the image failed –
        // still save the transaction_reference_id
      } else if (uploadData) {
        payment_proof_path = uploadData.path;
      }
    }

    const total = Math.max(0, Math.round((subtotal + shipCost - discount) * 100) / 100);

    // 9. Insert the order
    const { data: newOrder, error: orderErr } = await sb
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        subtotal,
        shipping_fee: shipCost,
        discount,
        total,
        coupon_code: couponCode,
        customer_name,
        customer_phone,
        address_line1,
        address_line2,
        city,
        notes,
        transaction_reference_id,
        payment_proof_path,
      })
      .select("id")
      .single();

    if (orderErr || !newOrder) {
      console.error("Order insert error:", orderErr);
      return {
        ok: false as const,
        error: orderErr?.message || "CREATE_FAILED",
      };
    }

    // 10. Insert order items
    const itemsToInsert = orderItemsData.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
    }));

    const { error: itemsErr } = await sb.from("order_items").insert(itemsToInsert);
    if (itemsErr) {
      console.error("Order items insert error:", itemsErr);
      // Order already created – don't roll back, just log
    }

    // 11. Fire-and-forget email notification to admin
    // (does not block the response)
    async function sendOrderEmail({
  orderId,
  customerName,
  phone,
  total,
  address,
  city,
}: {
  orderId: string;
  customerName: string;
  phone: string;
  total: number;
  address: string;
  city: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is missing in Vercel Environment Variables!");
    return;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "AURA Perfumes", email: "ofoftot@gmail.com" },
        to: [{ email: "ofoftot@gmail.com", name: "AURA Admin" }],
        subject: `🚨 طلب جديد في AURA – ${total} EGP (#${orderId.slice(0, 8)})`,
        htmlContent: `
          <div style="font-family:sans-serif;padding:24px;background:#0a0a0a;color:#D6B25E;max-width:560px;margin:0 auto;">
            <h2 style="margin:0 0 16px;font-size:22px;">✨ وصلك طلب جديد!</h2>
            <p><strong>رقم الطلب:</strong> ${orderId}</p>
            <p><strong>الاسم:</strong> ${customerName}</p>
            <p><strong>الهاتف:</strong> ${phone}</p>
            <p><strong>العنوان:</strong> ${address}, ${city}</p>
            <p><strong>الإجمالي:</strong> ${total} EGP</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Brevo Email Error Response:", res.status, errText);
    } else {
      console.log("Order email sent successfully via Brevo!");
    }
  } catch (err) {
    console.error("Failed to send order email:", err);
  }
}

    // 12. Success
    return { ok: true as const, orderId: newOrder.id };
  } catch (err: unknown) {
    console.error("createOrder unexpected error:", err);
    const message = err instanceof Error ? err.message : "SERVER_ERROR";
    return { ok: false as const, error: message };
  }
}
