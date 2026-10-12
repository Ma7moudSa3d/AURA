import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSettings, getUser } from "@/lib/data";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function Checkout() {
  const user = await getUser();
  if (!user) redirect("/login?next=/checkout");

  const t = await getTranslations("checkout");
  const [settings, { data: profile }] = await Promise.all([
    getSettings(),
    supabaseServer().from("profiles").select("full_name, phone").eq("id", user.id).single(),
  ]);

  return (
    <div className="container-x py-12">
      <h1 className="h-display mb-10 text-5xl">{t("title")}</h1>
      <CheckoutForm
        defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "" }}
        shippingFee={Number(settings?.shipping_fee ?? 60)}
        freeThreshold={Number(settings?.free_shipping_threshold ?? 2000)}
        payNumber={process.env.NEXT_PUBLIC_PAYMENT_NUMBER ?? settings?.contact_phone ?? "01016267377"}
        enableCOD={Boolean(settings?.enable_cod ?? true)}
        enableInstapay={Boolean(settings?.enable_instapay ?? true)}
        enableDeposit={Boolean(settings?.enable_deposit ?? true)}
      />
    </div>
  );
}
