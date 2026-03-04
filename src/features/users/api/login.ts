import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IUser, ILoginBody } from "@/features/users/interfaces";
import { recordFailedAttempt } from "@/lib/loginRateLimiter";

export async function loginHandler(body: ILoginBody, ip?: string) {
  const { email, password, rememberMe } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email y contraseña son requeridos" },
      { status: 400 },
    );
  }

  try {
    // Traemos también el status de la institución (si tiene)
    const [rows] = await connection.execute<any[]>(
      `SELECT
         u.*,
         i.status AS institution_status
       FROM users u
       LEFT JOIN institutions i ON i.id = u.institution_id
       WHERE u.email = ?
       LIMIT 1`,
      [email],
    );

    if (!rows || rows.length === 0) {
      if (ip) await recordFailedAttempt(ip);
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const user = rows[0] as IUser & { institution_status?: string | null };

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      if (ip) await recordFailedAttempt(ip);
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    // 🚫 Usuario archivado
    if (user.status === "archived") {
      return NextResponse.json(
        {
          message:
            "Tu cuenta fue desactivada. Contactá a un administrador para reactivarla.",
        },
        { status: 403 },
      );
    }

    // ⏳ Usuario pendiente
    if (user.status === "pending") {
      return NextResponse.json(
        { message: "Tu cuenta todavía está pendiente de aprobación." },
        { status: 403 },
      );
    }

    // 🚫 Cualquier otro estado no activo
    if (user.status !== "active") {
      return NextResponse.json(
        { message: "Tu cuenta no está habilitada para iniciar sesión." },
        { status: 403 },
      );
    }

    // 🔒 Regla: client sin institution_id NO puede iniciar sesión
    if (user.role === "client" && user.institution_id == null) {
      return NextResponse.json(
        {
          message:
            "Tu cuenta todavía no tiene institución asignada. Contactá a un administrador.",
        },
        { status: 403 },
      );
    }

    // 🏢 Regla: si la institución está inactiva, el client NO puede entrar
    if (
      user.role === "client" &&
      user.institution_id != null &&
      user.institution_status === "inactive"
    ) {
      return NextResponse.json(
        {
          message:
            "Tu institución está inactiva. Contactá a un administrador para reactivarla.",
        },
        { status: 403 },
      );
    }

    // Update last_login
    await connection.execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    );

    // JWT
    const tokenExpiry = rememberMe ? "30d" : "1d";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        institution_id: user.institution_id ?? null,
      },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiry },
    );

    const cookieMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 // 30 días
      : 24 * 60 * 60; // 1 día

    const response = NextResponse.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieMaxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
