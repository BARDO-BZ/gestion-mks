import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connection from "@/lib/db";
import {
  IForgotPasswordBody,
  IUserWithToken,
} from "@/features/users/interfaces";

export async function forgotPasswordHandler(body: IForgotPasswordBody) {
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json(
      { message: "Token y contraseña son requeridos" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 },
    );
  }

  try {
    // Buscar usuario con token válido
    const [rows] = await connection.execute<IUserWithToken[]>(
      'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND status = "active"',
      [token],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Token inválido o expirado" },
        { status: 400 },
      );
    }

    const user = rows[0];

    // Hashear nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Actualizar contraseña y limpiar token
    await connection.execute(
      `UPDATE users
       SET password_hash = ?, reset_token = '', reset_token_expiry = '', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [hashedPassword, user.id],
    );

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
