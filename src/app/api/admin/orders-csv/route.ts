import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await checkAdmin()).ok) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabaseServer().from("orders").select("*").order("created_at", { ascending: false });
  const cols = ["id", "created_at", "status", "customer_name", "customer_email", "customer_phone", "city", "address_line1", "subtotal", "discount_total", "shipping_fee", "total", "transaction_reference_id", "admin_note"];
  const csv = [cols.join(","), ...(data ?? []).map((o: any) => cols.map((c) => cell(o[c])).join(","))].join("\n");
  return new NextResponse("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=aura-orders.csv" } });
}
