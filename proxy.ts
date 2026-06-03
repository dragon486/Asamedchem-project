// proxy.ts — Next.js 16 uses "proxy" convention instead of "middleware"
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role;

  // Public routes
  const publicPaths = ["/login", "/register", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes → admin only
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/seller/dashboard", req.url));
  }

  // Seller routes → seller and admin only
  if (pathname.startsWith("/seller") && role !== "seller" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Root → redirect to appropriate dashboard
  if (pathname === "/") {
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (role === "seller") return NextResponse.redirect(new URL("/seller/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
