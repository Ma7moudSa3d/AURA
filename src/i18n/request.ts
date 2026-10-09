import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const c = cookies().get("locale")?.value;
  const locale: Locale = c === "ar" ? "ar" : "en";
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
