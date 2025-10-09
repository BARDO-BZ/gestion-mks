// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard", "/profile", "/admin"];
const authRoutes = ["/login", "/register", "/forgot-password"];

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function isValidToken(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret); // HS256 por defecto
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname, searchParams } = request.nextUrl;
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuth = authRoutes.some((r) => pathname.startsWith(r));

  const valid = await isValidToken(token);

  if (isProtected && !valid) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set(
      "redirect",
      pathname + (searchParams ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(loginUrl);
  }

  if (valid && (pathname === "/" || isAuth)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
