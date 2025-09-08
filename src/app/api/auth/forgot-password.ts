import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import connection from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserWithToken extends RowDataPacket {
  id: number;
  email: string;
  reset_token: string;
  reset_token_expiry: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: "Token y contraseña son requeridos",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    // Buscar usuario con el token válido
    const [rows] = await connection.execute<UserWithToken[]>(
      'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND status = "active"',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    const user = rows[0];

    // Hashear nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Actualizar contraseña y limpiar token
    await connection.execute(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.status(200).json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}
