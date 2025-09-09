import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IExistingUser } from "@/features/users/interfaces";

export async function registerHandler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Método no permitido" },
      { status: 405 }
    );
  }

  const { email, password, name, lastName, role = "client" } = await req.json();

  // Validación básica
  if (!email || !password || !name || !lastName) {
    return NextResponse.json(
      { message: "Todos los campos son requeridos" },
      { status: 400 }
    );
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { message: "Formato de email inválido" },
      { status: 400 }
    );
  }

  // Validar contraseña (mínimo 8 caracteres)
  if (password.length < 8) {
    return NextResponse.json(
      { message: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute<IExistingUser[]>(
      "SELECT id, email FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "El usuario ya existe" },
        { status: 409 }
      );
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
    const response = NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user: {
          id: userId,
          email,
          name,
          lastName,
          role,
          status: "active",
        },
      },
      { status: 201 }
    );

    // Setear cookie en NextResponse
    response.cookies.set("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
