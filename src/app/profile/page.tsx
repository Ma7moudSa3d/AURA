import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("nav");

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <h1 className="h-display text-4xl text-amber-100">{t("profile")}</h1>
      <div className="p-8 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4 backdrop-blur-md">
        <h2 className="text-xl font-medium text-amber-400">مرحباً بك في AURA</h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          يمكنك من هنا متابعة حالة طلباتك الأخيرة وإدارة عناوين الشحن الخاصة بك.
        </p>
      </div>
    </div>
  );
}
