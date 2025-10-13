// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const protectedRoutes = ["/dashboard", "/profile", "/admin"];
const authRoutes = ["/"]; // sólo para no autenticados
const publicRoutes = ["/reset-password", "/forgot-password"]; // agregá las públicas que correspondan

const jwtSecret = process.env.JWT_SECRET;
const secret = jwtSecret ? new TextEncoder().encode(jwtSecret) : undefined;

type Session =
  | (JWTPayload & { userId?: number; email?: string; role?: string })
  | null;

async function verifyToken(token?: string): Promise<Session> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret); // HS256 por defecto
    return payload as Session;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search; // incluye el "?" si existe

  // 0) Siempre dejar pasar rutas públicas
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuth = authRoutes.some((r) => pathname === r); // match exacto para "/"

  const session = await verifyToken(token);
  const valid = !!session;

  // 1) Bloqueo de rutas protegidas si no hay token válido
  if (isProtected && !valid) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search || ""}`);
    return NextResponse.redirect(loginUrl);
  }

  // 2) Gate de admin: si entra a /admin/* y no es admin → al dashboard
  if (pathname.startsWith("/admin") && (!valid || session?.role !== "admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3) Si ya está autenticado y visita rutas de auth (ej. "/") → al dashboard
  if (valid && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
