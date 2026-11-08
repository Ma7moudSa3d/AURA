import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("nav");

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <h1 className="h-display text-4xl text-cream">{t("profile")}</h1>
      <div className="p-8 rounded-2xl bg-surface/80 border border-white/10 space-y-4 backdrop-blur-md">
        <h2 className="text-xl font-medium text-gold">مرحباً بك في AURA</h2>
        <p className="text-sm text-cream/70 leading-relaxed font-light">
          يمكنك من هنا متابعة حالة طلباتك الأخيرة وإدارة عناوين الشحن الخاصة بك.
        </p>
      </div>
    </div>
  );
}
