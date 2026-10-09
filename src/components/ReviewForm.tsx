"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { addReview } from "@/app/actions/cart";

export default function ReviewForm({ productId, loggedIn }: { productId: string; loggedIn: boolean }) {
  const t = useTranslations("product");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  if (!loggedIn) return null;
  if (done) return <p className="text-sm text-gold">✓</p>;
  return (
    <form className="mt-6 space-y-3" onSubmit={async (e) => { e.preventDefault(); const r = await addReview(productId, rating, body); if (r.ok) setDone(true); }}>
      <p className="label">{t("writeReview")}</p>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input w-24">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} className="input" />
      <button className="btn-ghost">{t("submitReview")}</button>
    </form>
  );
}
