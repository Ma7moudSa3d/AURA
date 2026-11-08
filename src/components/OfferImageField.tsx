"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createCampaignUpload } from "@/app/actions/admin";

export default function OfferImageField({ name, label, current, fallback }: { name: string; label: string; current: string | null; fallback: string }) {
  const [url, setUrl] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setErr("Choose an image file under 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const slot = await createCampaignUpload(name, file.name);
      if (!slot.ok) throw new Error(slot.error);
      const { error } = await supabaseBrowser().storage.from("product-images").uploadToSignedUrl(slot.path, slot.token, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      setUrl(slot.url);
      setRemoved(false);
      setFresh(true);
    } catch (ex: any) {
      setErr(ex?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-white/10 bg-surface p-3">
      <p className="mb-2 text-[11px] uppercase tracking-widest text-cream/60">{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {(url || (!removed && fallback)) && <img src={url || fallback} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} className="mb-2 aspect-square w-full object-cover" />}
      {url && !removed && <input type="hidden" name={name} value={url} />}
      {removed && <input type="hidden" name={`remove_${name}`} value="1" />}
      <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="block w-full text-xs text-cream/70 file:mr-2 file:border file:border-gold/50 file:bg-transparent file:px-2 file:py-1 file:text-gold" />
      {busy && <p className="mt-2 text-xs text-gold">Uploading…</p>}
      {fresh && !busy && <p className="mt-2 text-xs text-gold">✓ Uploaded. Press Save to publish it.</p>}
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      {url && (
        <button type="button" onClick={() => { setUrl(null); setRemoved(true); setFresh(false); }} className="mt-2 text-[11px] text-cream/50 underline">
          Remove custom image
        </button>
      )}
    </div>
  );
}
