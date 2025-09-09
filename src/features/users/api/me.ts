import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IUser, IJWTPayload } from "@/features/users/interfaces";

export async function meHandler(req: NextRequest) {
  try {
    // Leer cookie del request
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Token no encontrado" },
        { status: 401 }
      );
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

    // Obtener datos actualizados del usuario
    const [rows] = await connection.execute<IUser[]>(
      `SELECT id, email, name, lastName, role, status, last_login, created_at, updated_at 
       FROM users 
       WHERE id = ? AND status = "active"`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const user = rows[0];

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    console.error("Error en /api/auth/me:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
