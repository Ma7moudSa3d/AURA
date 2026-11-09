"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const links: [string, string][] = [
  ["/admin", "Dashboard"], ["/admin/orders", "Orders"], ["/admin/users", "Users"], ["/admin/products", "Products"],
  ["/admin/coupons", "Coupons"], ["/admin/reviews", "Reviews"], ["/admin/settings", "Settings"],
];

export default function AdminNav() {
  const path = usePathname() ?? "";
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 text-xs uppercase tracking-widest">
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
          className={`border px-4 py-2 transition hover:border-gold hover:text-gold ${active(href) ? "border-gold bg-gold/10 text-gold" : "border-white/10"}`}>
          {label}
        </Link>
      ))}
      <span className="ms-auto flex items-center gap-2">
        <Link href="/" className="px-3 py-2 text-cream/60 transition hover:text-gold">View site ↗</Link>
        <form action={logout}><button type="submit" className="border border-white/10 px-4 py-2 text-cream/70 transition hover:border-red-400/60 hover:text-red-300">Sign out</button></form>
      </span>
    </nav>
  );
}
