import { supabaseService } from "@/lib/supabase/server";
import { getCampaign } from "@/lib/campaign";
import { sendEmailDetailed, goldenFridayHtml } from "@/lib/email";
import { BUNDLE_TYPES } from "@/lib/offers";

export const GOLDEN_SUBJECT = "✦ Golden Friday by AURA — الجمعة الذهبية بدأت";

/**
 * Sends the Golden Friday announcement once per user (profiles.golden_mail_sent_at is the guard, set only after a successful send).
 * - no options: everyone who has not received it yet (cron / admin button)
 * - userId: just this user (new sign-up)
 * Does nothing unless the campaign is live.
 */
export async function sendGoldenAnnouncement(opts: { userId?: string } = {}) {
  const out = { live: false, pending: 0, sent: 0, failed: 0, error: undefined as string | undefined };
  try {
    const sb = supabaseService();
    const { data: st } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
    const campaign = getCampaign(st);
    if (!campaign) return out;
    out.live = true;

    let q = sb.from("profiles").select("id, email, full_name, name").is("golden_mail_sent_at", null).not("email", "is", null);
    if (opts.userId) q = q.eq("id", opts.userId);
    const { data: users, error } = await q.limit(opts.userId ? 1 : 500);
    if (error) { out.error = error.message; return out; }
    out.pending = users?.length ?? 0;
    if (!users?.length) return out;

    const { data: coupons } = await sb.from("coupons").select("code,type,expires_at").eq("is_active", true).in("type", [...BUNDLE_TYPES]);
    const offers = (coupons ?? []).filter((c: any) => !c.expires_at || new Date(c.expires_at) > new Date()).map((c: any) => ({ code: c.code as string, type: String(c.type) }));

    for (const u of users as any[]) {
      const r = await sendEmailDetailed(u.email, GOLDEN_SUBJECT, goldenFridayHtml(u.full_name || u.name || "", offers, campaign.endsAt));
      if (r.ok) {
        out.sent++;
        await sb.from("profiles").update({ golden_mail_sent_at: new Date().toISOString() }).eq("id", u.id);
      } else {
        out.failed++;
        out.error = r.error;
        if (/429|quota|limit/i.test(r.error ?? "")) break; // provider daily limit: stop, the next run continues with the rest
      }
      await new Promise((res) => setTimeout(res, 250));
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e);
  }
  return out;
}
