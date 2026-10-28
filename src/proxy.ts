import { NextResponse } from "next/server";

const COOKIE = "usp_admin_session";

// Edge proxy (Next.js 16) — checks cookie presence only. Actual auth is enforced in
// API routes and server components (DB-backed session validation).
export function proxy(req: Request) {
  const { pathname } = new URL(req.url);
  if (pathname === "/admin/login") return NextResponse.next();
  // Allow admin static assets
  if (pathname.startsWith("/admin/") && pathname.includes(".")) return NextResponse.next();
  const cookie = req.headers.get("cookie") || "";
  const has = cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE}=`));
  if (!has) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
