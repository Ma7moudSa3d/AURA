import { getTranslations } from "next-intl/server";
import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Privacy" };
export default async function Privacy() {
  const t = await getTranslations("pages");
  return <StaticPage title={t("privacyTitle")}><p>{t("privacyBody")}</p></StaticPage>;
}
