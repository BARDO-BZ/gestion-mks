import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

type UserRow = {
  id: number;
  email: string;
  role: "admin" | "client";
  status: string;
  institution_id: number | null;
};

export async function updateUserInstitutionAdminHandler(
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
    const institution_id =
      body?.institution_id === null || body?.institution_id === undefined
        ? null
        : Number(body.institution_id);

    if (institution_id !== null && !Number.isFinite(institution_id)) {
      return NextResponse.json(
        { message: "institution_id inválido" },
        { status: 400 },
      );
    }

    const [rows]: any = await connection.execute(
      `SELECT id, email, role, status, institution_id
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

    // Regla: client no puede quedar sin institución
    if (user.role === "client" && !institution_id) {
      return NextResponse.json(
        { message: "Un usuario client no puede tener institution_id null" },
        { status: 400 },
      );
    }

    // Validar existencia de institución si no es null
    if (institution_id) {
      const [instRows]: any = await connection.execute(
        `SELECT id FROM institutions WHERE id = ? AND status = "active" LIMIT 1`,
        [institution_id],
      );
      if (!instRows?.length) {
        return NextResponse.json(
          { message: "Institución no encontrada o inactiva" },
          { status: 400 },
        );
      }
    }

    await connection.execute(
      `UPDATE users
       SET institution_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [institution_id ?? null, userId],
    );

    return NextResponse.json({ message: "Institución actualizada" });
  } catch (error) {
    console.error("Error en updateUserInstitutionAdminHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
