import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/data";
import { money } from "@/lib/format";
import ProfileForm from "@/components/ProfileForm";

export const metadata = { title: "Account" };

export default async function Account() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  const t = await getTranslations("account");
  const s = await getTranslations("status");
  const c = await getTranslations("common");
  const locale = await getLocale();
  const sb = supabaseServer();
  const [{ data: profile }, { data: orders }] = await Promise.all([
    sb.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    sb.from("orders").select("id, status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  return (
    <div className="container-x grid gap-12 py-12 lg:grid-cols-2">
      <div>
        <h1 className="h-display mb-6 text-4xl">{t("profile")}</h1>
        <p className="mb-4 text-sm text-cream/60">{user.email}</p>
        <ProfileForm name={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
      </div>
      <div>
        <h2 className="h-display mb-6 text-4xl">{t("orders")}</h2>
        {(orders ?? []).length === 0 && <p className="text-cream/60">{t("none")}</p>}
        <div className="space-y-3">
          {(orders ?? []).map((o) => (
            <Link key={o.id} href={`/track?id=${o.id}`} className="card flex items-center justify-between p-4">
              <div><p dir="ltr" className="font-mono text-xs text-cream/60">{o.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-cream/40">{new Date(o.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}</p></div>
              <div className="text-end"><p className="text-gold">{money(Number(o.total), locale)} {c("currency")}</p><p className="text-xs">{s(o.status as "PAID")}</p></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
