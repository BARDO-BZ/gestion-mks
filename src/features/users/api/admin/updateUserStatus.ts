import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

type UserRow = {
  id: number;
  role: "admin" | "client";
  institution_id: number | null;
  status: string;
};

const ALLOWED_STATUS = new Set(["pending", "active", "inactive"]);

export async function updateUserStatusAdminHandler(
  req: NextRequest,
  id: string,
) {
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
    const status = String(body?.status || "").trim();

    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { message: "Status inválido. Use pending | active | inactive" },
        { status: 400 },
      );
    }

    const [rows]: any = await connection.execute(
      `SELECT id, role, institution_id, status
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

    // Regla: no activar client sin institución
    if (status === "active" && user.role === "client" && !user.institution_id) {
      return NextResponse.json(
        { message: "No podés activar un usuario client sin institution_id" },
        { status: 400 },
      );
    }

    await connection.execute(
      `UPDATE users
       SET status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, userId],
    );

    await logAdminAction({
      adminId: auth.id,
      action: "CHANGE_STATUS",
      targetType: "user",
      targetId: userId,
      details: { old_status: user.status, new_status: status },
    });

    return NextResponse.json({ message: "Estado actualizado" });
  } catch (error) {
    console.error("Error en updateUserStatusAdminHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
