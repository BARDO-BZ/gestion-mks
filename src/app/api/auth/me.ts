import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IUser } from "@/features/users/interfaces/user";

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "Token no encontrado" });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Obtener datos actualizados del usuario
    const [rows] = await connection.execute<IUser[]>(
      'SELECT id, email, name, lastName, role, status, last_login, created_at, updated_at FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = rows[0];

    res.status(200).json({
      user,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Token inválido" });
    }

    console.error("Error en /api/auth/me:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
