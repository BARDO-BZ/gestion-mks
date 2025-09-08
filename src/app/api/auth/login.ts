import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IUser } from "@/features/users/interfaces/user";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { email, password, rememberMe } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({
      message: "Email y contraseña son requeridos",
    });
  }

  try {
    // Buscar usuario en la base de datos
    const [rows] = await connection.execute<IUser[]>(
      'SELECT * FROM users WHERE email = ? AND status = "active"',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const user = rows[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // Actualizar último login
    await connection.execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id]
    );

    // Crear JWT
    const tokenExpiry = rememberMe ? "30d" : "1d";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiry }
    );

    // Configurar cookie
    const cookieMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000; // 30 días o 1 día

    res.setHeader("Set-Cookie", [
      `token=${token}; HttpOnly; Path=/; Max-Age=${
        cookieMaxAge / 1000
      }; SameSite=Strict${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    ]);

    // Responder con datos del usuario (sin contraseña)
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login exitoso",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}
