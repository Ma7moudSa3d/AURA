import { getTranslations } from "next-intl/server";
import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Shipping & Returns" };
export default async function Shipping() {
  const t = await getTranslations("pages");
  return <StaticPage title={t("shippingTitle")}><p>{t("shippingBody")}</p></StaticPage>;
}
