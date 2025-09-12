import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";

export async function activateHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { message: "Token de activación requerido" },
      { status: 400 }
    );
  }

  try {
    // Buscar usuario con el token
    const [users] = await connection.execute(
      `SELECT id, email, name, last_name, role, activation_expires 
       FROM users 
       WHERE activation_token = ? AND status = 'pending'`,
      [token]
    );

    const usersArray = users as any[];

    if (usersArray.length === 0) {
      return NextResponse.json(
        { message: "Token inválido o cuenta ya activada" },
        { status: 400 }
      );
    }

    const user = usersArray[0];

    // Verificar si el token ha expirado
    if (new Date() > new Date(user.activation_expires)) {
      return NextResponse.json(
        { message: "El token de activación ha expirado" },
        { status: 400 }
      );
    }

    // Activar cuenta
    await connection.execute(
      `UPDATE users 
       SET status = 'active', activation_token = NULL, activation_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [user.id]
    );

    // Crear JWT
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json(
      {
        message: "Cuenta activada exitosamente",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
          role: user.role,
          status: "active",
        },
      },
      { status: 200 }
    );

    // Setear cookie
    response.cookies.set("token", jwtToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error activando cuenta:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
