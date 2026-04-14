import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

type Body = { name?: string; account_number?: string | null };

export async function updateInstitutionHandler(req: NextRequest, id: string) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const idNum = Number(id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const name = (body.name || "").trim();
    const account_number = body.account_number !== undefined
      ? (body.account_number ? String(body.account_number).trim() : null)
      : undefined;

    if (!name) {
      return NextResponse.json(
        { message: "El nombre es requerido" },
        { status: 400 },
      );
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

    if (account_number !== undefined) {
      await connection.execute(
        `UPDATE institutions SET name = ?, account_number = ? WHERE id = ?`,
        [name, account_number, idNum],
      );
    } else {
      await connection.execute(`UPDATE institutions SET name = ? WHERE id = ?`, [name, idNum]);
    }

    const [rows]: any = await connection.execute(
      `SELECT id, name, account_number, status, created_at FROM institutions WHERE id = ?`,
      [idNum],
    );

    return NextResponse.json({ institution: rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Error en updateInstitutionHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
