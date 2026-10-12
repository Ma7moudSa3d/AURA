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
        sender: { name: "AURA Store", email: "aurafragrances111@gmail.com" },
        to: [{ email: "aurafragrances111@gmail.com", name: "AURA Admin" }],
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
// Action: Validate Coupon Live before Checkout
// ──────────────────────────────────────────────
export async function validateCouponAction(code: string, subtotal: number) {
  if (!code || !code.trim()) {
    return { ok: false as const, error: "كود الكوبون فارغ" };
  }

  const user = await getUser();
  if (!user) {
    return { ok: false as const, error: "يرجى تسجيل الدخول أولاً" };
  }

  const sb = supabaseServer();
  const cleanCode = code.trim().toUpperCase();

  const { data: coupon, error } = await sb
    .from("coupons")
    .select("*")
    .ilike("code", cleanCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { ok: false as const, error: "كود الكوبون غير صحيح أو غير مفعّل" };
  }

  // 1. Expiration
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { ok: false as const, error: "هذا الكوبون منتهي الصلاحية" };
  }

  // 2. Max Uses
  if (coupon.max_uses && (coupon.used_count ?? 0) >= coupon.max_uses) {
    return { ok: false as const, error: "تم استنفاد الحد الأقصى لاستخدام هذا الكوبون" };
  }

  // 3. First Order Only Check
  if (coupon.first_order_only) {
    const { count, error: countErr } = await sb
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!countErr && count && count > 0) {
      return { ok: false as const, error: "هذا الكوبون مخصص للطلب الأول فقط" };
    }
  }

  // Calculate discount
  let discount = 0;
  const numVal = Number(coupon.value ?? 0);
  const percent = Number(coupon.discount_percent ?? (coupon.type === "percent" ? numVal : 0));
  const amount = Number(coupon.discount_amount ?? (coupon.type === "fixed" ? numVal : 0));

  if (percent > 0) {
    discount = (subtotal * percent) / 100;
  } else if (amount > 0) {
    discount = amount;
  }

  return {
    ok: true as const,
    code: coupon.code,
    discount: Math.round(discount * 100) / 100,
    freeShipping: Boolean(coupon.free_shipping),
    firstOrderOnly: Boolean(coupon.first_order_only),
  };
}

// ──────────────────────────────────────────────
// Main Server Action: createOrder
// ──────────────────────────────────────────────
export async function createOrder(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { ok: false as const, error: "AUTH_REQUIRED" };

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

    if (!transaction_reference_id && (!file || file.size === 0)) {
      return { ok: false as const, error: "PROOF_REQUIRED" };
    }

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

    const { data: settings } = await sb
      .from("settings")
      .select("shipping_fee, free_shipping_threshold")
      .eq("id", 1)
      .maybeSingle();

    const shippingFee = Number(settings?.shipping_fee ?? 60);
    const freeThreshold = Number(settings?.free_shipping_threshold ?? 2000);
    let shipCost = subtotal >= freeThreshold ? 0 : shippingFee;

    // Coupon Validation
    let discount = 0;
    let couponCode: string | null = null;

    if (couponRaw.length > 0) {
      const couponRes = await validateCouponAction(couponRaw, subtotal);
      if (!couponRes.ok) {
        return { ok: false as const, error: couponRes.error };
      }
      couponCode = couponRes.code;
      discount = couponRes.discount;
      if (couponRes.freeShipping) {
        shipCost = 0;
      }
    }

    // Upload payment proof
    let payment_proof_path: string | null = null;
    let payment_proof_url: string | null = null;

    if (file && file.size > 0) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadErr } = await sb.storage
        .from("payment-proofs")
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (!uploadErr && uploadData) {
        payment_proof_path = uploadData.path;
        payment_proof_url = `https://qjwisnczaffrouaadqzg.supabase.co/storage/v1/object/public/payment-proofs/${fileName}`;
      }
    }

    const total = Math.max(0, Math.round((subtotal + shipCost - discount) * 100) / 100);

    // Insert Order
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
        customer_email: user.email ?? "aurafragrances111@gmail.com",
        customer_phone,
        address_line1,
        address_line2,
        city,
        notes,
        transaction_reference_id,
        payment_proof_path,
        payment_proof_url,
      })
      .select("id")
      .single();

    if (orderErr || !newOrder) {
      console.error("Order insert error:", orderErr);
      return { ok: false as const, error: orderErr?.message || "CREATE_FAILED" };
    }

    // Update coupon usage count (FIXED TYPE ERROR BY USING TRY/CATCH)
    if (couponCode) {
      try {
        const { error: rpcError } = await sb.rpc("increment_coupon_used", { coupon_code: couponCode });
        if (rpcError) {
          await sb.from("coupons").update({ used_count: 1 }).eq("code", couponCode);
        }
      } catch (err) {
        console.error("RPC failed, falling back to update:", err);
        await sb.from("coupons").update({ used_count: 1 }).eq("code", couponCode);
      }
    }

    // Insert Order Items
    const itemsToInsert = orderItemsData.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
      product_title_snapshot: item.title,
      line_total: item.price * item.qty,
    }));

    await sb.from("order_items").insert(itemsToInsert);

    // Send Email
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
