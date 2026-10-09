import { getTranslations } from "next-intl/server";
import StaticPage from "@/components/StaticPage";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Contact" };
export default async function Contact() {
  const t = await getTranslations("pages");
  const n = await getTranslations("nav");
  const s = await getSettings();
  return (
    <StaticPage title={t("contactTitle")}>
      <p>{t("contactBody")}</p>
      {s.contact_email && <p>{s.contact_email}</p>}
      {s.contact_phone && <p dir="ltr">{s.contact_phone}</p>}
      <WhatsAppButton number={s.whatsapp_number} message="Hello AURA" label={n("whatsapp")} />
    </StaticPage>
  );
}
