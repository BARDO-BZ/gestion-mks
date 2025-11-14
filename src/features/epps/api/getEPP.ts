import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "./getAuthUser";

export async function getEppHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Traer el EPP
    const [eppRows]: any = await connection.execute(
      `SELECT *
       FROM epps
       WHERE id = ?`,
      [eppId]
    );

    if (!eppRows || eppRows.length === 0) {
      return NextResponse.json(
        { message: "EPP no encontrado" },
        { status: 404 }
      );
    }

    const epp = eppRows[0];

    // Traer logs básicos (opcional, pero ya lo dejamos listo)
    const [logRows]: any = await connection.execute(
      `SELECT id, type, details, created_at
       FROM epp_logs
       WHERE epp_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [eppId]
    );

    return NextResponse.json(
      {
        epp,
        logs: logRows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en getEppHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
