import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sendAbandonedReminders } from "@/lib/abandoned";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expected = process.env.CRON_TOKEN;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!expected || got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await sendAbandonedReminders());
}
