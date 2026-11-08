"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { Campaign } from "@/lib/campaign";

const Ctx = createContext<Campaign | null>(null);
export const CampaignProvider = ({ value, children }: { value: Campaign | null; children: React.ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);
export const useCampaign = () => useContext(Ctx);

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ endsAt, size = "sm" }: { endsAt: string | null; size?: "sm" | "lg" }) {
  const isAr = useLocale() === "ar";
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const parts = [
    [Math.floor(s / 86400), isAr ? "يوم" : "Days"],
    [Math.floor((s % 86400) / 3600), isAr ? "ساعة" : "Hrs"],
    [Math.floor((s % 3600) / 60), isAr ? "دقيقة" : "Min"],
    [s % 60, isAr ? "ثانية" : "Sec"],
  ] as const;
  const big = size === "lg";
  return (
    <div dir="ltr" className={`inline-flex items-center ${big ? "gap-3" : "gap-1.5"}`} aria-label="countdown">
      {parts.map(([v, label]) => (
        <div key={label} className={big ? "min-w-[64px] border border-gold/40 bg-ink/60 px-3 py-3 text-center" : "text-center"}>
          <span className={`font-mono font-bold ${big ? "text-3xl text-gold" : "text-xs"}`}>{pad(v)}</span>
          <span className={`block uppercase ${big ? "mt-1 text-[10px] tracking-widest text-cream/60" : "sr-only"}`}>{label}</span>
          {!big && label !== (isAr ? "ثانية" : "Sec") && <span className="mx-0.5 opacity-60">:</span>}
        </div>
      ))}
    </div>
  );
}

export function CodeChip({ code, dark = false }: { code: string; dark?: boolean }) {
  const isAr = useLocale() === "ar";
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        try { navigator.clipboard?.writeText(code); } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`inline-flex items-center gap-2 border border-dashed px-3 py-1 font-mono text-xs font-bold tracking-widest ${
        dark ? "border-ink/60 text-ink hover:bg-ink/10" : "border-gold text-gold hover:bg-gold/10"
      }`}
      title={isAr ? "انسخ الكود" : "Copy code"}
    >
      {code}
      <span className="text-[10px] font-normal normal-case tracking-normal opacity-80">
        {copied ? (isAr ? "✓ تم النسخ" : "✓ Copied") : isAr ? "نسخ" : "Copy"}
      </span>
    </button>
  );
}

/** Thin bar shown above the header on every page while the campaign is live. */
export function CampaignBar() {
  const c = useCampaign();
  const isAr = useLocale() === "ar";
  if (!c) return null;
  return (
    <div className="bg-gold px-3 py-2 text-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-widest">
        <span>✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}</span>
        <span className="hidden normal-case tracking-normal sm:inline">{isAr ? c.headline_ar : c.headline_en}</span>
        {c.code && (
          <span className="inline-flex items-center gap-2">
            {isAr ? "كود الخصم" : "Code"} <CodeChip code={c.code} dark />
          </span>
        )}
        <Countdown endsAt={c.endsAt} />
      </div>
    </div>
  );
}

/** Home page hero while the campaign is live. */
export function CampaignHero() {
  const c = useCampaign();
  const isAr = useLocale() === "ar";
  if (!c) return null;
  return (
    <section className="relative grid min-h-[80vh] place-items-center overflow-hidden px-5 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(214,178,94,.28),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold" />
      <div className="relative max-w-3xl">
        <p className="mb-5 text-xs uppercase tracking-[.5em] text-gold">{isAr ? "حملة لفترة محدودة" : "Limited-time campaign"}</p>
        <h1 className="h-display bg-gold bg-clip-text text-6xl leading-tight text-transparent sm:text-8xl">
          {isAr ? "الجمعة الذهبية" : "Golden Friday"}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-cream/80">{isAr ? c.headline_ar : c.headline_en}</p>
        <div className="mt-8"><Countdown endsAt={c.endsAt} size="lg" /></div>
        {c.code && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-cream/60">{isAr ? "استخدم كود الخصم عند الدفع" : "Use this code at checkout"}</span>
            <CodeChip code={c.code} />
          </div>
        )}
        <Link href="/shop" className="btn-gold mt-10">{isAr ? "تسوق العروض" : "Shop the offers"}</Link>
      </div>
    </section>
  );
}

/** Small ribbon for product cards. */
export function CampaignRibbon() {
  const c = useCampaign();
  const isAr = useLocale() === "ar";
  if (!c) return null;
  return (
    <div className="absolute right-0 top-3 z-10 bg-ink/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold shadow-lg border border-gold/50 rtl:left-0 rtl:right-auto">
      ✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}
    </div>
  );
}

/** One-line reminder used in the cart drawer and checkout. */
export function CampaignNote() {
  const c = useCampaign();
  const isAr = useLocale() === "ar";
  if (!c?.code) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-cream/80">
      <span>✦ {isAr ? "الجمعة الذهبية: استخدم الكود" : "Golden Friday: use code"}</span>
      <CodeChip code={c.code} />
    </div>
  );
}

/** Banner at the top of the shop page. */
export function ShopCampaignStrip() {
  const c = useCampaign();
  const isAr = useLocale() === "ar";
  if (!c) return null;
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-gold/40 bg-gold/5 px-5 py-4">
      <div>
        <p className="h-display text-2xl text-gold">{isAr ? "الجمعة الذهبية" : "Golden Friday"}</p>
        <p className="text-sm text-cream/70">{isAr ? c.headline_ar : c.headline_en}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {c.code && <CodeChip code={c.code} />}
        <Countdown endsAt={c.endsAt} />
      </div>
    </div>
  );
}
