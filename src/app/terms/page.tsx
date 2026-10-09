import { getTranslations } from "next-intl/server";
import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Terms" };
export default async function Terms() {
  const t = await getTranslations("pages");
  return <StaticPage title={t("termsTitle")}><p>{t("termsBody")}</p></StaticPage>;
}
