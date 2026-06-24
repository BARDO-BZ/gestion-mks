import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { EmailService } from "@/features/email/services/email-service"; // si ya lo tenés
import { logAdminAction } from "@/lib/adminLog";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  last_name: string | null;
  role: "admin" | "client";
  status: "pending" | "active" | "archived" | string;
  institution_id: number | null;
};

export async function approveUserAdminHandler(req: NextRequest, id: string) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const userId = Number(id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const institution_id =
      body?.institution_id === null || body?.institution_id === undefined
        ? null
        : Number(body.institution_id);

    // Traer usuario
    const [rows]: any = await connection.execute(
      `SELECT id, email, name, last_name, role, status, institution_id
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId],
    );

    if (!rows?.length) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const user = rows[0] as UserRow;

    if (user.status !== "pending") {
      return NextResponse.json(
        { message: "Solo se pueden aprobar usuarios en estado pending" },
        { status: 400 },
      );
    }

    // Regla: client requiere institución
    const finalInstitutionId =
      institution_id !== null ? institution_id : user.institution_id;

    if (user.role === "client" && !finalInstitutionId) {
      return NextResponse.json(
        {
          message:
            "Un usuario client debe tener institution_id para ser aprobado",
        },
        { status: 400 },
      );
    }

    await connection.execute(
      `UPDATE users
       SET status = "active",
           institution_id = ?,
           activation_token = NULL,
           activation_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [finalInstitutionId ?? null, userId],
    );

    await logAdminAction({
      adminId: auth.id,
      action: "APPROVE_USER",
      targetType: "user",
      targetId: userId,
      details: { institution_id: finalInstitutionId },
    });

    // Email “cuenta aprobada”
    // OJO: si no querés enviar todavía, comentá esto.
    try {
      await EmailService.sendAccountApprovedEmail({
        name: `${user.name ?? ""} ${user.last_name ?? ""}`.trim() || user.email,
        email: user.email,
      });
    } catch (e) {
      console.error("Error enviando email de aprobación:", e);
    }

    return NextResponse.json({ message: "Usuario aprobado" });
  } catch (error) {
    console.error("Error en approveUserAdminHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
