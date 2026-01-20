import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

type Body = { status?: "active" | "inactive" };

export async function updateInstitutionStatusHandler(
  req: NextRequest,
  id: string,
) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const idNum = Number(id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const status = body.status;

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json({ message: "Status inválido" }, { status: 400 });
    }

    const [exists]: any = await connection.execute(
      `SELECT id FROM institutions WHERE id = ?`,
      [idNum],
    );
    if (!exists?.length) {
      return NextResponse.json(
        { message: "Institución no encontrada" },
        { status: 404 },
      );
    }

    await connection.execute(
      `UPDATE institutions SET status = ? WHERE id = ?`,
      [status, idNum],
    );

    const [rows]: any = await connection.execute(
      `SELECT id, name, status, created_at FROM institutions WHERE id = ?`,
      [idNum],
    );

    return NextResponse.json({ institution: rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Error en updateInstitutionStatusHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
