import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

type Body = {
  name?: string;
  account_number?: string | null;
  status?: "active" | "inactive";
};

export async function createInstitutionHandler(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = (await req.json().catch(() => ({}))) as Body;

    const name = (body.name || "").trim();
    const account_number = body.account_number ? String(body.account_number).trim() : null;
    const status = (body.status || "active") as "active" | "inactive";

    if (!name) {
      return NextResponse.json(
        { message: "El nombre es requerido" },
        { status: 400 },
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        { message: "Nombre demasiado largo (máx 150 caracteres)" },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ message: "Status inválido" }, { status: 400 });
    }

    const [result]: any = await connection.execute(
      `INSERT INTO institutions (name, account_number, status, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, account_number, status],
    );

    const insertedId = Number(result.insertId);

    const [rows]: any = await connection.execute(
      `SELECT id, name, account_number, status, created_at FROM institutions WHERE id = ?`,
      [insertedId],
    );

    return NextResponse.json({ institution: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error en createInstitutionHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
