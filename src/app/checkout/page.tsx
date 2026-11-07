import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/CheckoutForm";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const { data: s } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="h-display mb-10 text-5xl">{t("title")}</h1>
      <CheckoutForm
        defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "" }}
        shippingFee={Number(s?.shipping_fee ?? 60)}
        freeThreshold={Number(s?.free_shipping_threshold ?? 2000)}
        payNumber={process.env.NEXT_PUBLIC_PAYMENT_NUMBER ?? s?.contact_phone ?? "01016267377"}
        enableCOD={s?.enable_cod ?? true}
        enableInstapay={s?.enable_instapay ?? true}
        enableDeposit={s?.enable_deposit ?? true}
      />
    </div>
  );
}
