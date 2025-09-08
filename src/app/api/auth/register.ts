import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ExistingUser extends RowDataPacket {
  id: number;
  email: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { email, password, name, lastName, role = "client" } = req.body;

  // Validación básica
  if (!email || !password || !name || !lastName) {
    return res.status(400).json({
      message: "Todos los campos son requeridos",
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Formato de email inválido",
    });
  }

  // Validar contraseña (mínimo 8 caracteres)
  if (password.length < 8) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute<ExistingUser[]>(
      "SELECT id, email FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "El usuario ya existe",
      });
    }

    // Hashear contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, name, lastName, role, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [email, hashedPassword, name, lastName, role]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    // Crear JWT
    const token = jwt.sign(
      {
        userId,
        email,
        role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    // Configurar cookie
    res.setHeader("Set-Cookie", [
      `token=${token}; HttpOnly; Path=/; Max-Age=${
        24 * 60 * 60
      }; SameSite=Strict${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    ]);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: userId,
        email,
        name,
        lastName,
        role,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}
