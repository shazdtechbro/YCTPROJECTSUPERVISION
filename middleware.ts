import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge gate for PAGE navigations: presence check only. The Admin SDK can't run
 * on the edge, so this does NOT verify the cookie or read claims.
 *
 * /api/* is never matched — route handlers authenticate themselves and must
 * return JSON 401/403. Full verification + role enforcement is in each route
 * group's server layout via requireRole(), and in Firestore rules.
 */
const SESSION_COOKIE = "__session";
const AUTH_PAGES = ["/login", "/signup"];
/** Reachable without a session, including the social preview image. */
const PUBLIC = ["/", "/login", "/signup", "/opengraph-image", "/yabatech-og-preview.png"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")),
  );
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
