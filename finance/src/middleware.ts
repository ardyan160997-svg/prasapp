import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect actual finance app routes so UI and API auth stay aligned.
  const protectedPaths = [
    "/dashboard",
    "/transactions",
    "/savings",
    "/plans",
    "/settings",
    "/catatan-keuangan",
    "/ringkasan",
    "/tabungan",
    "/rencana",
    "/wishlist",
    "/alokasi",
    "/pengaturan",
  ];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const authCookie = request.cookies.get("household_auth")?.value;
    if (authCookie !== "true") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === "/login") {
    const authCookie = request.cookies.get("household_auth")?.value;
    if (authCookie === "true") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/savings/:path*",
    "/plans/:path*",
    "/settings/:path*",
    "/catatan-keuangan/:path*",
    "/ringkasan/:path*",
    "/tabungan/:path*",
    "/rencana/:path*",
    "/wishlist/:path*",
    "/alokasi/:path*",
    "/pengaturan/:path*",
    "/login",
  ],
};