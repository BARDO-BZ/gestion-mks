import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function listAdminLogsHandler(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const [[{ total }]]: any = await connection.execute(
      `SELECT COUNT(*) AS total FROM admin_logs`,
    );

    const [rows]: any = await connection.execute(
      `SELECT
         al.id,
         al.action,
         al.target_type,
         al.target_id,
         al.details,
         al.created_at,
         u.email    AS admin_email,
         u.name     AS admin_name,
         u.last_name AS admin_last_name
       FROM admin_logs al
       JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
    );

    return NextResponse.json({
      data: rows || [],
      meta: { page, pageSize, total: Number(total) },
    });
  } catch (error) {
    console.error("Error en listAdminLogsHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
