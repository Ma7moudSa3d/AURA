import { supabaseService } from "@/lib/supabase/server";
import { sendEmail, abandonedHtml } from "@/lib/email";

/** Finds carts with items untouched for 24h (and not yet reminded), emails the owner of each cart. */
export async function sendAbandonedReminders(): Promise<{ checked: number; sent: number }> {
  const svc = supabaseService();
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: carts } = await svc
    .from("carts")
    .select("id, user_id, cart_items(qty, products(title_en))")
    .lt("updated_at", cutoff)
    .is("reminder_sent_at", null);
  let sent = 0;
  for (const c of carts ?? []) {
    const items = ((c as any).cart_items ?? []).map((i: any) => ({ title: i.products?.title_en ?? "Fragrance", qty: i.qty }));
    if (!items.length) continue;
    // skip users who ordered after the cart was last updated
    const { count } = await svc.from("orders").select("id", { count: "exact", head: true }).eq("user_id", c.user_id).gt("created_at", cutoff);
    if (count) continue;
    const { data: u } = await svc.auth.admin.getUserById(c.user_id);
    const email = u.user?.email;
    if (!email) continue;
    const name = (u.user?.user_metadata?.full_name as string) ?? "";
    if (await sendEmail(email, "Your AURA cart is waiting", abandonedHtml(name, items))) {
      await svc.from("carts").update({ reminder_sent_at: new Date().toISOString() }).eq("id", c.id);
      sent++;
    }
  }
  return { checked: carts?.length ?? 0, sent };
}
