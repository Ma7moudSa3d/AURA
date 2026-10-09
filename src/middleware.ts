import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-cookie";

const OWNER = "ofoftot@gmail.com";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const path = req.nextUrl.pathname;
  const redirect = (to: string, withNext = true) => {
    const url = req.nextUrl.clone();
    url.pathname = to;
    url.search = withNext ? `?next=${encodeURIComponent(path)}` : "";
    return NextResponse.redirect(url);
  };

  // Customer-only areas
  if (["/checkout", "/account", "/track"].some((p) => path === p || path.startsWith(p + "/")) && !user) {
    return redirect("/login");
  }

  // Admin area: owner email + email-OTP cookie + TOTP (aal2). Login page is the only exception.
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user || user.email !== OWNER) return NextResponse.rewrite(new URL("/404", req.url));
    const otpOk = await verifyAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value, user.id);
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!otpOk || aal?.currentLevel !== "aal2") return redirect("/admin/login", false);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
