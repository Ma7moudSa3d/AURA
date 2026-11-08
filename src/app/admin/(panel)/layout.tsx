import AdminNav from "@/components/AdminNav";
import { notFound, redirect } from "next/navigation";
import { checkAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const r = await checkAdmin(); // second, server-component-level gate (middleware is the first)
  if (!r.ok) {
    if (r.reason === "no_otp" || r.reason === "no_mfa") redirect("/admin/login");
    notFound();
  }
  return (
    <div dir="ltr" className="container-x py-8 font-sans">
      <AdminNav />
      {children}
    </div>
  );
}
