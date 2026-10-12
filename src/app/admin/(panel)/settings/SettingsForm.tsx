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
        const res = await saveSettings(formData);
        if (res && res.ok === false) {
          setMessage({ type: "error", text: res.error || "Failed to save settings." });
        } else {
          setMessage({ type: "success", text: "Settings saved successfully! 🎉" });
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
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
        step={type === "number" ? "0.01" : undefined}
      />
    </div>
  );

  const toggle = (label: string, name: string, defaultChecked: boolean) => (
    <div className="flex items-center justify-between bg-surface border border-white/10 px-4 py-3 rounded">
      <label className="label text-xs uppercase tracking-widest text-white cursor-pointer" htmlFor={name}>
        {label}
      </label>
      <input
        type="checkbox"
        id={name}
        name={name}
        defaultChecked={defaultChecked}
        className="w-5 h-5 accent-gold cursor-pointer"
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

      {/* Payment Methods Section */}
      <div className="sm:col-span-2 mt-4">
        <h3 className="text-gold h-display text-lg mb-4 border-b border-white/10 pb-2">Payment Methods</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {toggle("Cash on Delivery", "enable_cod", s?.enable_cod ?? true)}
          {toggle("InstaPay (Full)", "enable_instapay", s?.enable_instapay ?? true)}
          {toggle("25% Deposit", "enable_deposit", s?.enable_deposit ?? true)}
        </div>
      </div>

      <div className="sm:col-span-2 mt-4 border-b border-white/10 pb-2">
        <h3 className="text-gold h-display text-lg">Store Info</h3>
      </div>

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
        className="btn-gold sm:col-span-2 mt-4 py-3 px-6 bg-gold text-black font-bold uppercase tracking-wider rounded hover:bg-gold/90 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "SAVING..." : "SAVE SETTINGS"}
      </button>
    </form>
  );
}
