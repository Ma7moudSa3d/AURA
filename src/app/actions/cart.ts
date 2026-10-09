"use server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const items = z.array(z.object({ product_id: z.string().uuid(), qty: z.number().int().min(1).max(20) })).max(30);

/** Persists the signed-in user's cart (RLS-scoped) so abandoned-cart reminders work. Guests stay in localStorage. */
export async function syncCart(raw: unknown): Promise<{ ok: boolean }> {
  const parsed = items.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false };
  const { data: cart } = await sb.from("carts").upsert({ user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("id").single();
  if (!cart) return { ok: false };
  await sb.from("cart_items").delete().eq("cart_id", cart.id);
  if (parsed.data.length) await sb.from("cart_items").insert(parsed.data.map((i) => ({ ...i, cart_id: cart.id })));
  return { ok: true };
}

export async function loadCart(): Promise<{ product_id: string; qty: number }[]> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb.from("cart_items").select("product_id, qty, carts!inner(user_id)").eq("carts.user_id", user.id);
  return (data ?? []).map((r) => ({ product_id: r.product_id, qty: r.qty }));
}

export async function addReview(productId: string, rating: number, body: string): Promise<{ ok: boolean }> {
  const p = z.object({ id: z.string().uuid(), rating: z.number().int().min(1).max(5), body: z.string().trim().max(1000) })
    .safeParse({ id: productId, rating, body });
  if (!p.success) return { ok: false };
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await sb.from("reviews").insert({ product_id: p.data.id, user_id: user.id, rating: p.data.rating, body: p.data.body });
  return { ok: !error };
}
