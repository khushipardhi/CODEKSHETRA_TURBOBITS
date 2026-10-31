/* ════════════════════════════════════════════════════════
   Next.js Middleware — City Route Validation
   
   1. Validates [city] param for city-scoped routes
   2. Redirects legacy routes (/dashboard → /nagpur/dashboard)
   3. Sets x-city header for API routes
   ════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VALID_CITIES = new Set(["nagpur", "pune", "mumbai"]);

/** Legacy citizen routes that need city prefix */
const LEGACY_CITIZEN_ROUTES = [
  "/dashboard",
  "/my-reports",
  "/profile",
  "/report",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Redirect legacy citizen routes to default city ───
  for (const route of LEGACY_CITIZEN_ROUTES) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      // Check localStorage preference via cookie, or default to nagpur
      const storedCity = request.cookies.get("urban-link-city")?.value;
      const city = storedCity && VALID_CITIES.has(storedCity) ? storedCity : "nagpur";
      const newUrl = request.nextUrl.clone();
      newUrl.pathname = `/${city}${pathname}`;
      return NextResponse.redirect(newUrl);
    }
  }

  // ─── Validate city slug on /[city]/ routes ───
  const cityRouteMatch = pathname.match(/^\/(nagpur|pune|mumbai)(\/|$)/);
  if (cityRouteMatch) {
    const city = cityRouteMatch[1];
    // Set city header for downstream use
    const response = NextResponse.next();
    response.headers.set("x-city", city);
    return response;
  }

  // ─── Admin city routes: /admin/[city] ───
  const adminCityMatch = pathname.match(/^\/admin\/(nagpur|pune|mumbai)(\/|$)/);
  if (adminCityMatch) {
    const city = adminCityMatch[1];
    const response = NextResponse.next();
    response.headers.set("x-city", city);
    return response;
  }

  // ─── Department city routes: /department/[city] ───
  const deptCityMatch = pathname.match(/^\/department\/(nagpur|pune|mumbai)(\/|$)/);
  if (deptCityMatch) {
    const city = deptCityMatch[1];
    const response = NextResponse.next();
    response.headers.set("x-city", city);
    return response;
  }

  // ─── Redirect legacy department routes (/department/police → /department/nagpur/police) ───
  const legacyDeptMatch = pathname.match(/^\/department\/([a-z_]+)(\/.*)?$/);
  if (legacyDeptMatch && !VALID_CITIES.has(legacyDeptMatch[1])) {
    const deptCode = legacyDeptMatch[1];
    const rest = legacyDeptMatch[2] || "";
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/department/nagpur/${deptCode}${rest}`;
    return NextResponse.redirect(newUrl);
  }

  // ─── Redirect /department to /department/nagpur ───
  if (pathname === "/department" || pathname === "/department/") {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = "/department/nagpur";
    return NextResponse.redirect(newUrl);
  }

  // ─── Redirect legacy admin routes (/admin → /admin/nagpur, /admin/map → /admin/nagpur/map) ───
  if (pathname === "/admin" || pathname === "/admin/") {
    const storedCity = request.cookies.get("urban-link-city")?.value;
    const city = storedCity && VALID_CITIES.has(storedCity) ? storedCity : "nagpur";
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/admin/${city}`;
    return NextResponse.redirect(newUrl);
  }

  const legacyAdminMatch = pathname.match(/^\/admin\/([a-z_]+)(\/.*)?$/);
  if (legacyAdminMatch && !VALID_CITIES.has(legacyAdminMatch[1])) {
    const storedCity = request.cookies.get("urban-link-city")?.value;
    const city = storedCity && VALID_CITIES.has(storedCity) ? storedCity : "nagpur";
    const rest = pathname.substring("/admin".length);
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/admin/${city}${rest}`;
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match citizen routes (legacy and new)
    "/dashboard/:path*",
    "/my-reports/:path*",
    "/profile/:path*",
    "/report/:path*",
    // Match city-prefixed routes
    "/nagpur/:path*",
    "/pune/:path*",
    "/mumbai/:path*",
    // Match admin routes
    "/admin/:path*",
    // Match department routes
    "/department/:path*",
  ],
};
