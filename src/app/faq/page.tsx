import { getTranslations } from "next-intl/server";
import StaticPage from "@/components/StaticPage";

export const metadata = { title: "FAQ" };
export default async function Faq() {
  const t = await getTranslations("pages");
  const items = t.raw("faq") as { q: string; a: string }[];
  return (
    <StaticPage title={t("faqTitle")}>
      {items.map((i) => (
        <details key={i.q} className="card group p-5"><summary className="h-display cursor-pointer text-xl group-open:text-gold">{i.q}</summary><p className="mt-3">{i.a}</p></details>
      ))}
    </StaticPage>
  );
}
