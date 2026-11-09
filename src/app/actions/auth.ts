"use server";
import { z } from "zod";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { ADMIN_COOKIE, signAdminCookie } from "@/lib/admin-cookie";
import { isAdminEmail } from "@/lib/admin-emails";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const ip = () => headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
const safeNext = (n?: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

const cred = z.object({ email: z.string().trim().email().max(200), password: z.string().min(8).max(100) });

export type Res = { ok: boolean; error?: string; info?: string };

export async function login(fd: FormData): Promise<Res> {
  const p = cred.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!p.success) return { ok: false, error: "INVALID" };
  if (!rateLimit(`login:${ip()}:${p.data.email.toLowerCase()}`, 8, 15 * 60_000)) return { ok: false, error: "RATE_LIMITED" };
  const { error } = await supabaseServer().auth.signInWithPassword(p.data);
  if (error) return { ok: false, error: "INVALID" };
  redirect(safeNext(String(fd.get("next") ?? "/")));
}

export async function signup(fd: FormData): Promise<Res> {
  const p = cred.extend({ full_name: z.string().trim().min(2).max(100) })
    .safeParse({ email: fd.get("email"), password: fd.get("password"), full_name: fd.get("full_name") });
  if (!p.success) return { ok: false, error: "INVALID" };
  if (!rateLimit(`signup:${ip()}`, 5, 60 * 60_000)) return { ok: false, error: "RATE_LIMITED" };
  const next = safeNext(String(fd.get("next") ?? "/"));
  const { error } = await supabaseServer().auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.full_name }, emailRedirectTo: `${SITE}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error("[auth] signup failed:", error.status, error.code, error.message);
    return { ok: false, error: error.status === 429 || error.code === "over_email_send_rate_limit" ? "EMAIL_RATE_LIMIT" : "FAILED" };
  }
  return { ok: true, info: "VERIFY" };
}

export async function forgotPassword(fd: FormData): Promise<Res> {
  const email = z.string().trim().email().safeParse(fd.get("email"));
  if (!email.success) return { ok: false, error: "INVALID" };
  if (!rateLimit(`forgot:${ip()}`, 5, 60 * 60_000)) return { ok: false, error: "RATE_LIMITED" };
  const { error } = await supabaseServer().auth.resetPasswordForEmail(email.data, { redirectTo: `${SITE}/auth/callback?next=/reset-password` });
  if (error) console.error("[auth] reset email failed:", error.status, error.code, error.message);
  return { ok: true, info: "SENT" }; // same response whether or not the email exists
}

export async function updatePassword(fd: FormData): Promise<Res> {
  const pw = z.string().min(8).max(100).safeParse(fd.get("password"));
  if (!pw.success) return { ok: false, error: "INVALID" };
  const { error } = await supabaseServer().auth.updateUser({ password: pw.data });
  if (error) return { ok: false, error: "FAILED" };
  redirect("/account");
}

export async function logout() {
  await supabaseServer().auth.signOut();
  cookies().delete(ADMIN_COOKIE);
  redirect("/");
}

export async function setLocale(locale: "en" | "ar") {
  cookies().set("locale", locale === "ar" ? "ar" : "en", { path: "/", maxAge: 31536000, sameSite: "lax" });
}

export async function updateProfile(fd: FormData): Promise<Res> {
  const p = z.object({ full_name: z.string().trim().min(2).max(100), phone: z.string().trim().max(20).optional() })
    .safeParse({ full_name: fd.get("full_name"), phone: fd.get("phone") ?? "" });
  if (!p.success) return { ok: false, error: "INVALID" };
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH" };
  const { error } = await sb.from("profiles").upsert({ id: user.id, ...p.data }, { onConflict: "id" });
  if (error) console.error("[profile] update failed:", error.message);
  return error ? { ok: false, error: "FAILED" } : { ok: true };
}

/* ---------- Admin login: password -> email OTP -> TOTP (aal2) ---------- */

export async function adminPasswordStep(fd: FormData): Promise<Res> {
  const p = cred.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!p.success) return { ok: false, error: "BAD_FORMAT" }; // email invalid or password < 8 chars
  if (!rateLimit(`admin-login:${ip()}`, 10, 15 * 60_000)) return { ok: false, error: "RATE_LIMITED" };
  // Generic failure for non-owner so the allowlist is not revealed
  const email = p.data.email.toLowerCase();
  if (!isAdminEmail(email)) return { ok: false, error: "INVALID" };
  const sb = supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password: p.data.password });
  if (error) {
    console.error("[admin-login] password step:", error.message);
    return { ok: false, error: /not confirmed/i.test(error.message) ? "NOT_CONFIRMED" : "INVALID" };
  }
  const { error: otpErr } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (otpErr) {
    console.error("[admin-login] otp step:", otpErr.message);
    return { ok: false, error: /rate limit/i.test(otpErr.message) ? "EMAIL_RATE_LIMIT" : "OTP_FAILED" };
  }
  return { ok: true, info: "OTP_SENT" };
}

export async function adminOtpStep(fd: FormData): Promise<Res> {
  const code = z.string().regex(/^\d{6,8}$/).safeParse(fd.get("code"));
  if (!code.success) return { ok: false, error: "INVALID" };
  if (!rateLimit(`admin-otp:${ip()}`, 6, 15 * 60_000)) return { ok: false, error: "RATE_LIMITED" };
  const sb = supabaseServer();
  const { data: cur } = await sb.auth.getUser(); // the password step already signed this admin in
  const email = cur.user?.email?.toLowerCase();
  if (!email || !isAdminEmail(email)) return { ok: false, error: "INVALID" };
  const { data, error } = await sb.auth.verifyOtp({ email, token: code.data, type: "email" });
  if (error || !isAdminEmail(data.user?.email)) return { ok: false, error: "INVALID" };
  cookies().set(ADMIN_COOKIE, await signAdminCookie(data.user!.id), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 12 * 3600,
  });
  return { ok: true };
}
