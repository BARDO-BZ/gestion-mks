import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IUser, ILoginBody } from "@/features/users/interfaces";

export async function loginHandler(body: ILoginBody) {
  const { email, password, rememberMe } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email y contraseña son requeridos" },
      { status: 400 },
    );
  }

  try {
    const [rows] = await connection.execute<IUser[]>(
      'SELECT * FROM users WHERE email = ? AND status = "active"',
      [email],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    // 🔒 Regla: un client sin institution_id NO puede iniciar sesión
    if (user.role === "client" && user.institution_id == null) {
      return NextResponse.json(
        {
          message:
            "Tu cuenta todavía no tiene institución asignada. Contactá a un administrador.",
        },
        { status: 403 },
      );
    }

    await connection.execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    );

    const tokenExpiry = rememberMe ? "30d" : "1d";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        institution_id: user.institution_id,
        last_login: user.last_login,
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
