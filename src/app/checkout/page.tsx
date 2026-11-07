import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/CheckoutForm";
import { createClient } from "@supabase/supabase-js";

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let settings = null;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: s } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      settings = s;
    } catch (e) {
      console.error("CheckoutPage settings load error:", e);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="h-display mb-10 text-5xl">{t("title")}</h1>
      <CheckoutForm
        defaults={{ name: "", phone: "" }}
        shippingFee={Number(settings?.shipping_fee ?? 60)}
        freeThreshold={Number(settings?.free_shipping_threshold ?? 2000)}
        payNumber={process.env.NEXT_PUBLIC_PAYMENT_NUMBER ?? settings?.contact_phone ?? "01016267377"}
        enableCOD={settings?.enable_cod ?? true}
        enableInstapay={settings?.enable_instapay ?? true}
        enableDeposit={settings?.enable_deposit ?? true}
      />
    </div>
  );
}
