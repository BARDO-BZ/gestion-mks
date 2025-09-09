import { NextResponse } from "next/server";

export async function logoutHandler() {
  const response = NextResponse.json({
    message: "Logout exitoso",
  });

  // Borrar cookie de autenticación
  response.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // expira inmediatamente
    path: "/",
  });

  return response;
}
