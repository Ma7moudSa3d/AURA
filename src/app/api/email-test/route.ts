import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sendEmailDetailed, OWNER } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: GET /api/email-test?token=<CRON_TOKEN>[&to=someone@example.com]
 * Sends a test email and returns the provider's real answer, so you can see exactly why mail fails.
 * Protected by CRON_TOKEN. Never prints secrets, only whether each setting exists.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const expected = process.env.CRON_TOKEN ?? "";
  const got = url.searchParams.get("token") ?? "";
  if (!expected || got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = url.searchParams.get("to") || OWNER;
  const result = await sendEmailDetailed(
    to,
    "AURA email test",
    "<p>If you can read this, email sending from the AURA website works.</p>"
  );

  return NextResponse.json({
    to,
    result,
    env: {
      BREVO_API_KEY: Boolean(process.env.BREVO_API_KEY),
      BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL ?? "(not set, using OWNER_EMAIL)",
      OWNER_EMAIL: process.env.OWNER_EMAIL ?? "(not set, using default)",
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      SMTP_HOST: Boolean(process.env.SMTP_HOST),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}
