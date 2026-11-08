"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/actions/admin";
import { isoToCairoLocal } from "@/lib/campaign";
import OfferImageField from "@/components/OfferImageField";

interface SettingsFormProps {
  initialSettings: any;
}

export default function SettingsForm({ initialSettings: s }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Controlled State for payment checkboxes
  const [enableCod, setEnableCod] = useState<boolean>(s?.enable_cod !== false);
  const [enableInstapay, setEnableInstapay] = useState<boolean>(s?.enable_instapay !== false);
  const [enableDeposit, setEnableDeposit] = useState<boolean>(s?.enable_deposit !== false);

  useEffect(() => {
    setEnableCod(s?.enable_cod !== false);
    setEnableInstapay(s?.enable_instapay !== false);
    setEnableDeposit(s?.enable_deposit !== false);
  }, [s]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await saveSettings(formData);
        if (!res || res.ok !== true) {
          setMessage({ type: "error", text: res?.error || "Failed to save settings." });
        } else {
          setMessage({ type: "success", text: "Settings saved successfully! 🎉" });
          router.refresh();
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
        className="input w-full bg-surface border border-white/10 px-4 py-3 rounded text-cream focus:border-gold outline-none"
        step={type === "number" ? "0.01" : undefined}
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

      {/* Golden Friday campaign */}
      <div className="sm:col-span-2 mt-4 border border-gold/40 bg-gold/5 p-5">
        <h3 className="text-gold h-display text-lg mb-1">✦ Golden Friday Campaign</h3>
        <p className="mb-4 text-xs text-cream/60">
          When switched on (and before the end date), the whole store switches to the campaign look: top bar with countdown, home hero, shop banner,
          product ribbons and a coupon reminder in the cart and checkout. Remember to activate the matching coupon in Admin &rarr; Coupons.
        </p>
        <label className="mb-4 flex items-center justify-between border border-white/10 bg-surface px-4 py-3">
          <span className="text-xs uppercase tracking-widest text-cream">Campaign is live</span>
          <input type="checkbox" name="campaign_active" defaultChecked={!!s?.campaign_active} className="h-5 w-5 cursor-pointer accent-gold" />
        </label>
        <p className="mb-2 text-xs text-cream/60">Offer artwork: a square image. It uploads as soon as you pick it; press Save to publish.</p>
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <OfferImageField name="offer_image_100" label="Offer image: 2 × 100ML + 50ML free" current={s?.offer_image_100 ?? null} fallback="" />
          <OfferImageField name="offer_image_50" label="Offer image: 3 × 50ML, third half price" current={s?.offer_image_50 ?? null} fallback="" />
          <OfferImageField name="offer_image_pack" label="Pocket Pack image" current={s?.offer_image_pack ?? null} fallback="/offers/pocket-pack.jpg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {f("Ends at (Cairo time)", "campaign_ends_at", isoToCairoLocal(s?.campaign_ends_at), "datetime-local")}
          {f("Coupon code to promote", "campaign_code", s?.campaign_code)}
          {f("Headline (English)", "campaign_headline_en", s?.campaign_headline_en)}
          {f("Headline (Arabic)", "campaign_headline_ar", s?.campaign_headline_ar)}
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="sm:col-span-2 mt-4">
        <h3 className="text-gold h-display text-lg mb-4 border-b border-white/10 pb-2">Payment Methods</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between bg-surface border border-white/10 px-4 py-3 rounded">
            <label className="label text-xs uppercase tracking-widest text-cream cursor-pointer" htmlFor="enable_cod">
              Cash on Delivery
            </label>
            <input
              type="checkbox"
              id="enable_cod"
              name="enable_cod"
              checked={enableCod}
              onChange={(e) => setEnableCod(e.target.checked)}
              className="w-5 h-5 accent-gold cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-surface border border-white/10 px-4 py-3 rounded">
            <label className="label text-xs uppercase tracking-widest text-cream cursor-pointer" htmlFor="enable_instapay">
              InstaPay (Full)
            </label>
            <input
              type="checkbox"
              id="enable_instapay"
              name="enable_instapay"
              checked={enableInstapay}
              onChange={(e) => setEnableInstapay(e.target.checked)}
              className="w-5 h-5 accent-gold cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-surface border border-white/10 px-4 py-3 rounded">
            <label className="label text-xs uppercase tracking-widest text-cream cursor-pointer" htmlFor="enable_deposit">
              25% Deposit
            </label>
            <input
              type="checkbox"
              id="enable_deposit"
              name="enable_deposit"
              checked={enableDeposit}
              onChange={(e) => setEnableDeposit(e.target.checked)}
              className="w-5 h-5 accent-gold cursor-pointer"
            />
          </div>
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
          className="input w-full bg-surface border border-white/10 px-4 py-3 rounded text-cream focus:border-gold outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-gold sm:col-span-2 mt-4 py-3 px-6 bg-gold text-ink font-bold uppercase tracking-wider rounded hover:bg-gold/90 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "SAVING..." : "SAVE SETTINGS"}
      </button>
    </form>
  );
}
