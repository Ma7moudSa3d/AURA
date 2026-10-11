"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/data";

// ──────────────────────────────────────────────
// Helper: Send order notification email via Brevo API
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
    console.error("❌ BREVO_API_KEY is missing in Vercel!");
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
        sender: { name: "AURA Store", email: "ofoftot@gmail.com" },
        to: [{ email: "ofoftot@gmail.com", name: "AURA Admin" }],
        subject: `🚨 طلب جديد في AURA – ${total} EGP (#${orderId.slice(0, 8)})`,
        htmlContent: `
          <div style="font-family:sans-serif;padding:24px;background:#0a0a0a;color:#D6B25E;max-width:560px;margin:0 auto;border:1px solid #222;">
            <h2 style="margin:0 0 16px;font-size:22px;">✨ وصلك طلب جديد في AURA!</h2>
            <p style="color:#fff;"><strong>رقم الطلب:</strong> ${orderId}</p>
            <p style="color:#fff;"><strong>اسم العميل:</strong> ${customerName}</p>
            <p style="color:#fff;"><strong>الهاتف:</strong> ${phone}</p>
            <p style="color:#fff;"><strong>العنوان:</strong> ${address}, ${city}</p>
            <p style="color:#fff;"><strong>الإجمالي:</strong> ${total} EGP</p>
            <hr style="border:none;border-top:1px solid #333;margin:20px 0;"/>
            <p style="margin:0;"><a href="https://aura-perfume-weld.vercel.app/admin/orders" style="color:#D6B25E;text-decoration:none;font-weight:bold;">اضغط هنا لمعاينة الطلب والإيصال في لوحة التحكم ←</a></p>
          </div>
        `,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("❌ Brevo Email Failed:", resData);
    } else {
      console.log("✅ Brevo Email Sent Successfully!", resData);
    }
  } catch (err) {
    console.error("❌ Error sending order email:", err);
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

    const couponRaw = (formData.get("coupon") as string)?.trim() || "";
    const itemsRaw = formData.get("items") as string;
    const file = formData.get("payment_proof") as File | null;

    // 3. Must have either transaction_reference_id OR proof image
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

    // 5. Fetch product prices & titles
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await sb
      .from("products")
      .select("id, title_en, price, discount_price, stock_qty")
      .in("id", productIds);

    if (prodErr || !products || products.length === 0) {
      return { ok: false as const, error: "INVALID_PRODUCTS" };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItemsData: { product_id: string; title: string; qty: number; price: number }[] = [];

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) continue;

      const unitPrice = Number(prod.discount_price ?? prod.price) || 0;
      subtotal += unitPrice * item.qty;
      orderItemsData.push({
        product_id: item.product_id,
        title: prod.title_en ?? "AURA Perfume",
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

    // 7. Coupon check
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

    // 8. Upload payment proof
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

      if (!uploadErr && uploadData) {
        payment_proof_path = uploadData.path;
      }
    }

    const total = Math.max(0, Math.round((subtotal + shipCost - discount) * 100) / 100);

    // 9. Insert order
    const { data: newOrder, error: orderErr } = await sb
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        subtotal,
        shipping_fee: shipCost,
        discount,
        discount_total: discount,
        total,
        coupon_code: couponCode,
        customer_name,
        customer_email: user.email ?? "ofoftot@gmail.com",
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
      product_title_snapshot: item.title,
      line_total: item.price * item.qty,
    }));

    await sb.from("order_items").insert(itemsToInsert);

    // 11. Send email notification
    await sendOrderEmail({
      orderId: newOrder.id,
      customerName: customer_name,
      phone: customer_phone,
      total,
      address: address_line1,
      city,
    });

    return { ok: true as const, orderId: newOrder.id };
  } catch (err: unknown) {
    console.error("createOrder unexpected error:", err);
    const message = err instanceof Error ? err.message : "SERVER_ERROR";
    return { ok: false as const, error: message };
  }
}
