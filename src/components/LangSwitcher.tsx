"use client";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/auth";

export default function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} aria-label="Switch language" className="text-xs tracking-widest text-cream/70 transition hover:text-gold"
      onClick={() => start(async () => { await setLocale(locale === "ar" ? "en" : "ar"); router.refresh(); })}>
      {locale === "ar" ? "EN" : "العربية"}
    </button>
  );
}
