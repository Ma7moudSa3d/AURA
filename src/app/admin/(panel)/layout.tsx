import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { checkAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const links = [["/admin", "Dashboard"], ["/admin/orders", "Orders"], ["/admin/products", "Products"], ["/admin/coupons", "Coupons"], ["/admin/reviews", "Reviews"], ["/admin/settings", "Settings"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const r = await checkAdmin(); // second, server-component-level gate (middleware is the first)
  if (!r.ok) {
    if (r.reason === "no_otp" || r.reason === "no_mfa") redirect("/admin/login");
    notFound();
  }
  return (
    <div dir="ltr" className="container-x py-8 font-sans">
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4 text-xs uppercase tracking-widest">
        {links.map(([href, label]) => <Link key={href} href={href} className="border border-white/10 px-4 py-2 transition hover:border-gold hover:text-gold">{label}</Link>)}
      </nav>
      {children}
    </div>
  );
}
