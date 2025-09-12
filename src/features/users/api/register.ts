import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import connection from "@/lib/db";
import { IExistingUser } from "@/features/users/interfaces";
import { EmailService } from "@/features/email/services/email-service";

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

    // Generar token de activación (opcional)
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Determinar si requiere activación por email
    const requiresActivation = process.env.REQUIRE_EMAIL_ACTIVATION === "true";
    const initialStatus = requiresActivation ? "pending" : "active";

    // Insertar usuario
    const [result] = await connection.execute(
      `INSERT INTO users (
        email, 
        password_hash, 
        name, 
        last_name, 
        role, 
        status, 
        activation_token, 
        activation_expires, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        email,
        hashedPassword,
        name,
        lastName,
        role,
        initialStatus,
        requiresActivation ? activationToken : null,
        requiresActivation ? activationExpires : null,
      ]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    // Enviar email de bienvenida
    try {
      if (requiresActivation) {
        await EmailService.sendAccountActivationEmail({
          name: `${name} ${lastName}`,
          email,
          activationToken,
        });
      } else {
        await EmailService.sendWelcomeEmail({
          name: `${name} ${lastName}`,
          email,
        });
      }
    } catch (emailError) {
      console.error("Error enviando email de bienvenida:", emailError);
      // No fallar el registro si el email falla
    }

    // Solo crear JWT y cookie si la cuenta no requiere activación
    let token = null;
    let responseData: any = {
      message: requiresActivation
        ? "Usuario registrado. Revisa tu email para activar tu cuenta."
        : "Usuario registrado exitosamente",
      user: {
        id: userId,
        email,
        name,
        lastName,
        role,
        status: initialStatus,
      },
      requiresActivation,
    };

    const response = NextResponse.json(responseData, { status: 201 });

    if (!requiresActivation) {
      // Crear JWT
      token = jwt.sign(
        {
          userId,
          email,
          role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      // Setear cookie en NextResponse
      response.cookies.set("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
