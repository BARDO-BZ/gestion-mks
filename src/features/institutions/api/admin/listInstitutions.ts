import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

export async function listInstitutionsHandler(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "").trim(); // active | inactive
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const whereParts: string[] = [];
    const values: any[] = [];

    if (q) {
      whereParts.push("(i.name LIKE ? OR CAST(i.id AS CHAR) LIKE ?)");
      values.push(`%${q}%`, `%${q}%`);
    }

    if (status) {
      whereParts.push("i.status = ?");
      values.push(status);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const offset = (safePage - 1) * safePageSize;

    // total (DISTINCT por el join)
    const [countRows]: any = await connection.execute(
      `
      SELECT COUNT(*) AS total
      FROM institutions i
      ${whereSql}
      `,
      values,
    );
    const total = Number(countRows?.[0]?.total || 0);

    // data
    // OJO: LIMIT/OFFSET interpolados (para evitar ER_WRONG_ARGUMENTS)
    const sql = `
      SELECT
        i.id,
        i.name,
        i.status,
        i.created_at,
        COUNT(DISTINCT u.id) AS users_count,
        COUNT(DISTINCT e.id) AS epps_count
      FROM institutions i
      LEFT JOIN users u ON u.institution_id = i.id
      LEFT JOIN epps e ON e.institution_id = i.id
      ${whereSql}
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT ${safePageSize} OFFSET ${offset}
    `;

    const [rows]: any = await connection.execute(sql, values);

    return NextResponse.json(
      {
        data: rows,
        pagination: {
          page: safePage,
          pageSize: safePageSize,
          total,
          totalPages: Math.ceil(total / safePageSize),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en listInstitutionsHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
