import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Rutas que requieren autenticación
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/admin",
  // Agregar más rutas según necesites
];

// Rutas que solo pueden acceder usuarios NO autenticados
const authRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar si es una ruta de autenticación
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Si no hay token y es una ruta protegida, redirigir al home
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay token, verificar su validez
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);

      // Si el token es válido y el usuario está intentando acceder a la página principal,
      // redirigir al dashboard
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      // Si el token es inválido, eliminarlo y redirigir si es ruta protegida
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("token");

      if (isProtectedRoute) {
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
