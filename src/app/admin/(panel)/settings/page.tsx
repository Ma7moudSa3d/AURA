import { saveSettings } from "@/app/actions/admin";
import { getSettings } from "@/lib/data";

export default async function SettingsPage() {
  const s = await getSettings();
  const f = (label: string, name: string, def: string | number | null, type = "text") => (
    <div><label className="label">{label}</label><input name={name} type={type} defaultValue={def ?? ""} className="input" step="0.01" /></div>
  );
  return (
    <form action={saveSettings} className="grid max-w-3xl gap-5 sm:grid-cols-2">
      {f("WhatsApp number (digits, with country code)", "whatsapp_number", s.whatsapp_number)}<div />
      {f("Shipping fee (EGP)", "shipping_fee", Number(s.shipping_fee), "number")}{f("Free shipping threshold (EGP)", "free_shipping_threshold", Number(s.free_shipping_threshold), "number")}
      {f("Instagram URL", "instagram", s.instagram)}{f("Facebook URL", "facebook", s.facebook)}{f("TikTok URL", "tiktok", s.tiktok)}<div />
      {f("Contact email", "contact_email", s.contact_email)}{f("Contact phone", "contact_phone", s.contact_phone)}
      {f("Announcement banner (EN)", "announcement_en", s.announcement_en)}
      <div><label className="label">Announcement banner (AR)</label><input name="announcement_ar" dir="rtl" defaultValue={s.announcement_ar ?? ""} className="input" /></div>
      <button className="btn-gold sm:col-span-2">Save settings</button>
    </form>
  );
}
