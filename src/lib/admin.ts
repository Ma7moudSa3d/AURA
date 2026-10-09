import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-cookie";

export const OWNER_EMAIL = "ofoftot@gmail.com";

export type AdminCheck = { ok: true; userId: string } | { ok: false; reason: "anon" | "not_owner" | "no_otp" | "no_mfa" };

/** Full server-side admin gate: owner email + DB role + email-OTP cookie + TOTP (aal2). */
export async function checkAdmin(): Promise<AdminCheck> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, reason: "anon" };
  if (user.email !== OWNER_EMAIL) return { ok: false, reason: "not_owner" };
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, reason: "not_owner" };
  if (!(await verifyAdminCookie(cookies().get(ADMIN_COOKIE)?.value, user.id))) return { ok: false, reason: "no_otp" };
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { ok: false, reason: "no_mfa" };
  return { ok: true, userId: user.id };
}

export async function requireAdmin() {
  const r = await checkAdmin();
  if (!r.ok) throw new Error("Forbidden");
  return r.userId;
}
