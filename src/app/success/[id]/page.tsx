import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmed" };

const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s);

export default async function SuccessPage({ params }: { params: { id: string } }) {
  const locale = await getLocale();
  const c = await getTranslations("common");
  const isAr = locale === "ar";

  let order: any = null;
  if (isUuid(params.id)) {
    // RLS: a customer can only read their own order, so this never leaks someone else's.
    const { data } = await supabaseServer()
      .from("orders")
      .select("id,total,payment_method,order_items(product_title_snapshot,qty,line_total)")
      .eq("id", params.id)
      .maybeSingle();
    order = data;
  }

  return (
    <div className="container-x max-w-2xl py-16 text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-gold text-3xl text-gold">✓</div>
      <h1 className="h-display text-4xl sm:text-5xl">{isAr ? "تم استلام طلبك" : "Thank you for your order"}</h1>
      <p className="mt-4 text-cream/70">
        {isAr
          ? "سنراجع الدفع ونؤكد طلبك قريباً. وصلتك رسالة على بريدك بتفاصيل الطلب."
          : "We will verify your payment and confirm shortly. A confirmation email is on its way."}
      </p>

      {order && (
        <div className="mt-10 border border-white/5 bg-surface p-6 text-start">
          <p className="text-xs uppercase tracking-widest text-cream/50">{isAr ? "رقم الطلب" : "Order ID"}</p>
          <p dir="ltr" className="mt-1 break-all font-mono text-sm text-gold">{order.id}</p>
          <ul className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm text-cream/70">
            {order.order_items?.map((i: any, n: number) => (
              <li key={n} className="flex justify-between gap-4">
                <span>{i.product_title_snapshot} × {i.qty}</span>
                <span>{money(Number(i.line_total), locale)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-white/10 pt-4 text-end text-lg text-gold">
            {money(Number(order.total), locale)} {c("currency")}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href={`/track?id=${params.id}`} className="btn-gold">{isAr ? "تتبّع الطلب" : "Track order"}</Link>
        <Link href="/shop" className="btn-ghost">{isAr ? "متابعة التسوق" : "Continue shopping"}</Link>
      </div>
    </div>
  );
}
