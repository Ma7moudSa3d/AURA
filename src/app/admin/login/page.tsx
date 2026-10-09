import { redirect } from "next/navigation";
import AdminLogin from "@/components/AdminLogin";
import { checkAdmin } from "@/lib/admin";

export const metadata = { title: "Owner", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const r = await checkAdmin();
  if (r.ok) redirect("/admin");
  return <div className="container-x py-16"><AdminLogin initialStep={!r.ok && r.reason === "no_mfa" ? "totp" : "password"} /></div>;
}
