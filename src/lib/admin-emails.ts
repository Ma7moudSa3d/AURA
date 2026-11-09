/** Accounts allowed into /admin (still need email OTP + authenticator app). Extra ones: ADMIN_EMAILS env, comma-separated. */
const BUILT_IN = ["aurafragrances111@gmail.com", "mahmoudmohammedsaad72@gmail.com"];

export const ADMIN_EMAILS: string[] = Array.from(
  new Set(
    [...BUILT_IN, ...(process.env.OWNER_EMAIL ? [process.env.OWNER_EMAIL] : []), ...(process.env.ADMIN_EMAILS ?? "").split(",")]
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ),
);

export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
