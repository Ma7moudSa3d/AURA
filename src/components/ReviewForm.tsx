"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { addReview } from "@/app/actions/cart";

export default function ReviewForm({
  productId,
  loggedIn,
  canReview,
}: {
  productId: string;
  loggedIn: boolean;
  canReview: boolean;
}) {
  const t = useTranslations("product");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. العميل مش مسجل دخول
  if (!loggedIn) {
    return (
      <div className="mt-6 border border-white/10 bg-surface/50 p-4 rounded text-xs text-cream/60 text-center">
        🔒 يرجى تسجيل الدخول أولاً لتتمكن من تقييم هذا المنتج.
      </div>
    );
  }

  // 2. العميل مسجل دخول بس لا يملك أوردر مستلم للمنتج ده
  if (!canReview) {
    return (
      <div className="mt-6 border border-amber-500/20 bg-amber-500/5 p-4 rounded text-xs text-amber-400/90 text-center">
        🛒 التقييم متاح حصرياً للعملاء الذين قاموا بشراء هذا المنتج واستلامه بالفعل.
      </div>
    );
  }

  // 3. تم إرسال الريفيو بنجاح
  if (done) {
    return (
      <div className="mt-6 border border-green-500/20 bg-green-500/10 p-4 rounded text-xs text-green-400 text-center font-semibold">
        ✓ شكراً لك! تم إرسال تقييمك بنجاح وسوف يظهر بعد مراجعة الإدارة.
      </div>
    );
  }

  // 4. نموذج كتابة الريفيو
  return (
    <form
      className="mt-6 space-y-3 border-t border-white/10 pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        const r = await addReview(productId, rating, body);
        setLoading(false);

        if (r.ok) {
          setDone(true);
        } else {
          setErrorMsg(r.error || "فشل إرسال التقييم");
        }
      }}
    >
      <p className="label">{t("writeReview")}</p>
      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
      
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="input w-28 bg-black/60 text-gold"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {"★".repeat(n)} ({n})
          </option>
        ))}
      </select>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        rows={3}
        required
        placeholder="اكتب انطباعك عن العطر..."
        className="input w-full bg-black/50 border border-white/20 p-3 text-white rounded text-sm"
      />

      <button
        type="submit"
        disabled={loading}
        className="btn-ghost w-full disabled:opacity-50"
      >
        {loading ? "جاري الإرسال..." : t("submitReview")}
      </button>
    </form>
  );
}
