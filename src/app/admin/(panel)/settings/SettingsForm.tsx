"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "@/app/actions/admin";

interface SettingsFormProps {
  initialSettings: any;
}

export default function SettingsForm({ initialSettings: s }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await saveSettings(formData);
        setMessage({ type: "success", text: "تم حفظ الإعدادات بنجاح! 🎉" });
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "حدث خطأ غير متوقع أثناء الحفظ." });
      }
    });
  }

  const f = (label: string, name: string, def: string | number | null, type = "text") => (
    <div>
      <label className="label text-xs uppercase tracking-widest text-gold/80 mb-2 block">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={def ?? ""}
        className="input w-full bg-surface border border-white/10 px-4 py-3 rounded text-white focus:border-gold outline-none"
        step="0.01"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-5 sm:grid-cols-2">
      {message && (
        <div
          className={`sm:col-span-2 p-4 rounded text-sm font-medium ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {f("WhatsApp number (digits, with country code)", "whatsapp_number", s?.whatsapp_number)}
      <div />
      {f("Shipping fee (EGP)", "shipping_fee", Number(s?.shipping_fee ?? 60), "number")}
      {f("Free shipping threshold (EGP)", "free_shipping_threshold", Number(s?.free_shipping_threshold ?? 2000), "number")}
      {f("Instagram URL", "instagram", s?.instagram)}
      {f("Facebook URL", "facebook", s?.facebook)}
      {f("TikTok URL", "tiktok", s?.tiktok)}
      <div />
      {f("Contact email", "contact_email", s?.contact_email ?? "aurafragrances111@gmail.com")}
      {f("Contact phone", "contact_phone", s?.contact_phone)}
      {f("Announcement banner (EN)", "announcement_en", s?.announcement_en)}
      <div>
        <label className="label text-xs uppercase tracking-widest text-gold/80 mb-2 block">
          Announcement banner (AR)
        </label>
        <input
          name="announcement_ar"
          dir="rtl"
          defaultValue={s?.announcement_ar ?? ""}
          className="input w-full bg-surface border border-white/10 px-4 py-3 rounded text-white focus:border-gold outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-gold sm:col-span-2 py-3 px-6 bg-gold text-black font-bold uppercase tracking-wider rounded hover:bg-gold/90 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "جاري الحفظ..." : "SAVE SETTINGS"}
      </button>
    </form>
  );
}
