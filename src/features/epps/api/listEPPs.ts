import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "./getAuthUser";

/**
 * GET /api/epps → listado con filtros básicos
 */
export async function listEppsHandler(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const institution = searchParams.get("institution") || "";
    const branch = searchParams.get("branch") || "";
    const service = searchParams.get("service") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (institution) {
      whereClauses.push("institution LIKE ?");
      params.push(`%${institution}%`);
    }
    if (branch) {
      whereClauses.push("branch LIKE ?");
      params.push(`%${branch}%`);
    }
    if (service) {
      whereClauses.push("service LIKE ?");
      params.push(`%${service}%`);
    }
    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
    }
    if (search) {
      whereClauses.push(
        "(code LIKE ? OR institution LIKE ? OR branch LIKE ? OR service LIKE ?)"
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // total
    const [countRows]: any = await connection.execute(
      `SELECT COUNT(*) as total FROM epps ${whereSql}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    // data
    const offset = (page - 1) * pageSize;
    const [rows]: any = await connection.execute(
      `SELECT * FROM epps
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error en listEppsHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
