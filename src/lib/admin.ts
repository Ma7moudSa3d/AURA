import { supabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminCookie } from "./admin-cookie";

export const OWNER_EMAIL = "aurafragrances111@gmail.com";
export const OWNER = OWNER_EMAIL;

export async function checkAdmin() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return { ok: false as const, reason: "not_logged_in" as const };

  const ownerEmail = process.env.OWNER_EMAIL || OWNER_EMAIL;
  if (user.email !== ownerEmail && user.email !== OWNER_EMAIL) {
    return { ok: false as const, reason: "not_owner" as const };
  }

  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value;
  const otpOk = await verifyAdminCookie(adminCookie, user.id);

  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();

  if (!otpOk) return { ok: false as const, reason: "no_otp" as const };
  if (aal?.currentLevel !== "aal2") return { ok: false as const, reason: "no_mfa" as const };

  return { ok: true as const, user };
}

export async function requireAdmin() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED: User not logged in");
  }

  const ownerEmail = process.env.OWNER_EMAIL || OWNER_EMAIL;
  if (user.email !== ownerEmail && user.email !== OWNER_EMAIL) {
    throw new Error("UNAUTHORIZED: Access denied");
  }

  return user;
}
