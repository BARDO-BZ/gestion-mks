import { NextResponse } from "next/server";
import crypto from "crypto";
import connection from "@/lib/db";
import { EmailService } from "@/features/email/services/email-service";
import { IUser } from "@/features/users/interfaces";

export async function requestPasswordResetHandler(body: { email: string }) {
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { message: "Email es requerido" },
      { status: 400 }
    );
  }

  try {
    // 1) Buscar usuario activo
    const [rows] = await connection.execute<IUser[]>(
      'SELECT id, name, email FROM users WHERE email = ? AND status = "active"',
      [email]
    );
    // Por seguridad, respondemos 200 aunque no exista para no filtrar correos.
    if ((rows as IUser[]).length === 0) {
      return NextResponse.json({
        message:
          "Si el email existe, vas a recibir un enlace para restablecer tu contraseña.",
      });
    }

    const user = (rows as IUser[])[0];

    // 2) Generar token y expiración (1 hora)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 día

    // 3) Guardar token y expiry
    await connection.execute(
      `UPDATE users 
       SET reset_token = ?, reset_token_expiry = ? 
       WHERE id = ?`,
      [resetToken, expiryDate, user.id]
    );

    // 4) Enviar email
    await EmailService.sendPasswordResetEmail({
      name: user.name ?? "Usuario",
      email: user.email,
      resetToken,
    });

    return NextResponse.json({
      message:
        "Si el email existe, vas a recibir un enlace para restablecer tu contraseña.",
    });
  } catch (error) {
    console.error("Error en request-password-reset:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
