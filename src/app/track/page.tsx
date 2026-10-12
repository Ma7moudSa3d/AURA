import { getLocale, getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { money } from "@/lib/format";

// منع التكييش لضمان التحديث اللحظي للعميل
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Track order" };

const FLOW = ["PENDING_PAYMENT_VERIFICATION", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s);

// دالة توحيد الحالات لربط الأدمن مع العميل مهما كانت طريقة الكتابة
function normalizeStatus(status?: string): string {
  if (!status) return "PENDING_PAYMENT_VERIFICATION";
  const u = status.toUpperCase().trim();
  if (u === "PENDING" || u === "PENDING_PAYMENT_VERIFICATION") return "PENDING_PAYMENT_VERIFICATION";
  if (u === "PAID") return "PAID";
  if (u === "CONFIRMED" || u === "PROCESSING") return "CONFIRMED";
  if (u === "SHIPPED") return "SHIPPED";
  if (u === "DELIVERED") return "DELIVERED";
  if (u === "CANCELLED" || u === "CANCELED" || u === "REFUNDED") return "CANCELED";
  return u;
}

export default async function Track({ searchParams }: { searchParams: { id?: string } }) {
  const t = await getTranslations("track");
  const s = await getTranslations("status");
  const c = await getTranslations("common");
  const locale = await getLocale();

  let order: any = null;
  if (isUuid(searchParams.id)) {
    const { data } = await supabaseServer()
      .from("orders")
      .select("id,status,total,created_at,order_items(product_title_snapshot,qty,line_total)")
      .eq("id", searchParams.id!)
      .single();
    order = data;
  }

  const currentStatus = order ? normalizeStatus(order.status) : "";
  const idx = order ? FLOW.indexOf(currentStatus as typeof FLOW[number]) : -1;

  return (
    <div className="container-x max-w-2xl py-12">
      <h1 className="h-display mb-8 text-5xl">{t("title")}</h1>
      <form className="mb-10 flex gap-3" method="get">
        <input name="id" defaultValue={searchParams.id} placeholder={t("enter")} dir="ltr" className="input" />
        <button className="btn-gold">{t("find")}</button>
      </form>

      {searchParams.id && !order && <p className="text-cream/60">{t("notFound")}</p>}

      {order && (
        <div className="border border-white/5 bg-surface p-6">
          <p dir="ltr" className="break-all font-mono text-xs text-cream/50">{order.id}</p>

          {currentStatus === "CANCELED" ? (
            <p className="mt-4 text-lg text-red-300">
              {s ? s("CANCELED") : "Canceled"}
            </p>
          ) : (
            <ol className="mt-6 space-y-4">
              {FLOW.map((st, i) => {
                const isCompleted = i <= idx;
                let label = st;
                try {
                  label = s(st);
                } catch {
                  label = st.replace(/_/g, " ");
                }

                return (
                  <li key={st} className={`flex items-center gap-4 ${isCompleted ? "text-gold" : "text-cream/30"}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full border ${isCompleted ? "border-gold bg-gold text-ink font-bold" : "border-white/20"}`}>
                      {isCompleted ? "✓" : i + 1}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ol>
          )}

          <ul className="mt-6 border-t border-white/10 pt-4 text-sm text-cream/70">
            {order.order_items?.map((i: any, n: number) => (
              <li key={n} className="flex justify-between">
                <span>{i.product_title_snapshot} × {i.qty}</span>
                <span>{money(Number(i.line_total), locale)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-end text-lg text-gold">{money(Number(order.total), locale)} {c("currency")}</p>
        </div>
      )}
    </div>
  );
}
