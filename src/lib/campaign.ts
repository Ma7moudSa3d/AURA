/** Golden Friday campaign helpers (pure; usable on server and client). Everything is driven by the `settings` row. */
export type Campaign = {
  name: string;
  code: string | null;
  endsAt: string | null; // ISO
  headline_en: string;
  headline_ar: string;
};

export function getCampaign(s: any): Campaign | null {
  if (!s?.campaign_active) return null;
  if (s.campaign_ends_at && new Date(s.campaign_ends_at).getTime() <= Date.now()) return null;
  return {
    name: "Golden Friday",
    code: s.campaign_code ? String(s.campaign_code).toUpperCase() : null,
    endsAt: s.campaign_ends_at ?? null,
    headline_en: s.campaign_headline_en || "Exclusive offers on all fragrances",
    headline_ar: s.campaign_headline_ar || "عروض حصرية على كل العطور",
  };
}

const TZ = "Africa/Cairo";

/** "2026-11-30T23:59" typed in the admin (Cairo time) → ISO string. */
export function cairoLocalToIso(local: string | null): string | null {
  if (!local || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return null;
  const asUtc = new Date(local.slice(0, 16) + ":00Z");
  if (isNaN(asUtc.getTime())) return null;
  const tz = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" })
    .formatToParts(asUtc).find((p) => p.type === "timeZoneName")?.value ?? "GMT+2";
  const m = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  const offsetMin = m ? Number(m[1]) * 60 + Math.sign(Number(m[1])) * Number(m[2] ?? 0) : 120;
  return new Date(asUtc.getTime() - offsetMin * 60000).toISOString();
}

/** ISO → "YYYY-MM-DDTHH:mm" in Cairo time, for <input type="datetime-local">. */
export function isoToCairoLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T").slice(0, 16);
}
