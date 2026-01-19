import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function listInstitutionsAdminHandler(req: NextRequest) {
  const auth = await getAuthUser(req);

  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const [rows]: any = await connection.execute(
      `SELECT id, name
       FROM institutions
       ORDER BY name ASC`,
    );

    return NextResponse.json({ data: rows || [] });
  } catch (error) {
    console.error("Error en listInstitutionsAdminHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
