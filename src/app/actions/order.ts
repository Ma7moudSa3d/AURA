"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/data";

export async function createOrder(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { ok: false, error: "AUTH_REQUIRED" };

    const customer_name = (formData.get("customer_name") as string)?.trim();
    const customer_phone = (formData.get("customer_phone") as string)?.trim();
    const address_line1 = (formData.get("address_line1") as string)?.trim();
    const address_line2 = (formData.get("address_line2") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim() || null;
    const transaction_reference_id = (formData.get("transaction_reference_id") as string)?.trim() || null;
    
    // الحل هنا: تجاهل الكوبون تماماً لو فارغ أو مسافات فقط
    const couponRaw = (formData.get("coupon") as string)?.trim();
    const itemsRaw = formData.get("items") as string;
    const file = formData.get("payment_proof") as File | null;

    if (!transaction_reference_id && (!file || file.size === 0)) {
      return { ok: false, error: "PROOF_REQUIRED" };
    }

    const items: { product_id: string; qty: number }[] = JSON.parse(itemsRaw || "[]");
    if (items.length === 0) return { ok: false, error: "EMPTY_CART" };

    const sb = supabaseServer();

    // 1. حساب أسعار المنتجات المباشرة
    const productIds = items.map((i) => i.product_id);
    const { data: products } = await sb
      .from("products")
      .select("id, price, discount_price")
      .in("id", productIds);

    if (!products || products.length === 0) {
      return { ok: false, error: "INVALID_PRODUCTS" };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) continue;
      const price = Number(prod.discount_price ?? prod.price);
      subtotal += price * item.qty;
      orderItemsData.push({
        product_id: item.product_id,
        qty: item.qty,
        price: price,
      });
    }

    // مصاريف الشحن
    const { data: settings } = await sb
      .from("settings")
      .select("shipping_fee, free_shipping_threshold")
      .eq("id", 1)
      .maybeSingle();

    const shippingFee = Number(settings?.shipping_fee ?? 60);
    const freeThreshold = Number(settings?.free_shipping_threshold ?? 2000);
    const shipCost = subtotal >= freeThreshold ? 0 : shippingFee;

    // 2. فحص الكوبون فقط إذا تم إدخال نص حقيقي
    let discount = 0;
    let couponCode: string | null = null;

    if (couponRaw && couponRaw.length > 0) {
      const { data: couponData } = await sb
        .from("coupons")
        .select("*")
        .ilike("code", couponRaw)
        .eq("is_active", true)
        .maybeSingle();

      if (!couponData) {
        return { ok: false, error: "BAD_COUPON" };
      }

      couponCode = couponData.code;
      const percent = Number(couponData.discount_percent ?? 0);
      discount = (subtotal * percent) / 100;
    }

    // 3. رفع صورة الإيصال
    let payment_proof_path: string | null = null;
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const buffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadErr } = await sb.storage
        .from("receipts")
        .upload(fileName, buffer, { contentType: file.type });

      if (!uploadErr && uploadData) {
        payment_proof_path = uploadData.path;
      }
    }

    const total = Math.max(0, subtotal + shipCost - discount);

    // 4. إدخال الطلب
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
      console.error("Order Insert Error:", orderErr);
      return { ok: false, error: orderErr?.message || "CREATE_FAILED" };
    }

    // 5. إدخال عناصر الطلب
    const itemsToInsert = orderItemsData.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
    }));

    await sb.from("order_items").insert(itemsToInsert);

    return { ok: true, orderId: newOrder.id };
  } catch (err: any) {
    console.error("Server Action Exception:", err);
    return { ok: false, error: err?.message || "SERVER_ERROR" };
  }
}
