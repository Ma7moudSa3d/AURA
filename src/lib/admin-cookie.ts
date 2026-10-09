// Signed, httpOnly cookie proving the admin passed the email-OTP challenge. HMAC via Web Crypto (edge-safe).
export const ADMIN_COOKIE = "aura_admin_otp";
const enc = new TextEncoder();

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(process.env.ADMIN_COOKIE_SECRET ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signAdminCookie(userId: string, ttlMs = 12 * 3600_000) {
  const exp = Date.now() + ttlMs;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyAdminCookie(value: string | undefined, userId: string) {
  if (!value || !process.env.ADMIN_COOKIE_SECRET) return false;
  const [uid, exp, sig] = value.split(".");
  if (!uid || !exp || !sig || uid !== userId || Number(exp) < Date.now()) return false;
  const expected = await hmac(`${uid}.${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
