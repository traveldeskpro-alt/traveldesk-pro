import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("tdp_auth_token")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // For prototype, we rely on client-side auth check in AppShell
  // This middleware can be extended to check Firebase auth tokens
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|icon.png).*)"],
};
