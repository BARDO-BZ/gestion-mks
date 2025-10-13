// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard", "/profile", "/admin"];
// Rutas "solo para no autenticados" (login/register). OJO: NO incluir /reset-password acá.
const authRoutes = ["/"];

const jwtSecret = process.env.JWT_SECRET;
const secret = jwtSecret ? new TextEncoder().encode(jwtSecret) : undefined;

async function isValidToken(token?: string) {
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, secret); // HS256 por defecto (match con jsonwebtoken)
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search; // incluye el "?" si existe

  // 1) Dejar pasar siempre la página pública de reset con token
  if (pathname.startsWith("/reset-password")) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuth = authRoutes.some((r) => pathname === r); // match exacto para "/"
  const valid = await isValidToken(token);

  // 2) Si intenta entrar a una ruta protegida sin token válido → al login (con redirect)
  if (isProtected && !valid) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search || ""}`);
    return NextResponse.redirect(loginUrl);
  }

  // 3) Si ya está autenticado y visita una ruta de auth (ej. "/") → al dashboard
  if (valid && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
