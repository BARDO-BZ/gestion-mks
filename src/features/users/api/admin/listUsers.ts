import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

type UserStatus = "pending" | "active" | "archived";

export async function listUsersAdminHandler(req: NextRequest) {
  const auth = await getAuthUser(req);

  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);

    // filtros
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim() as UserStatus | "";
    const role = (searchParams.get("role") || "").trim() as
      | "admin"
      | "client"
      | "";
    const institutionIdRaw = (searchParams.get("institution_id") || "").trim();

    // paginación (sanitizada)
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20", 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize >= 1 && pageSize <= 100
        ? pageSize
        : 20;

    const offset = (safePage - 1) * safePageSize;

    // ✅ ints finales (evita NaN y placeholders en LIMIT/OFFSET)
    const limitInt = Math.trunc(safePageSize);
    const offsetInt = Math.trunc(offset);

    const where: string[] = [];
    const values: any[] = [];

    if (status) {
      where.push("u.status = ?");
      values.push(status);
    }

    if (role) {
      where.push("u.role = ?");
      values.push(role);
    }

    // institution_id:
    // - si viene un número => filtra esa institución
    // - si viene "null" => usuarios sin institución
    if (institutionIdRaw) {
      if (institutionIdRaw === "null") {
        where.push("u.institution_id IS NULL");
      } else {
        const instId = Number(institutionIdRaw);
        if (!Number.isNaN(instId)) {
          where.push("u.institution_id = ?");
          values.push(instId);
        }
      }
    }

    if (search) {
      where.push("(u.email LIKE ? OR u.name LIKE ? OR u.last_name LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // limpieza de values por seguridad (por si algo queda undefined)
    const cleanedValues = values.filter((v) => v !== undefined);

    // Total
    const [countRows]: any = await connection.execute(
      `SELECT COUNT(*) as total
       FROM users u
       ${whereSql}`,
      cleanedValues,
    );

    const total = Number(countRows?.[0]?.total || 0);

    // Data (✅ LIMIT/OFFSET inline sanitizado)
    const [rows]: any = await connection.execute(
      `SELECT
         u.id,
         u.email,
         u.name,
         u.last_name,
         u.role,
         u.status,
         u.institution_id,
         u.last_login,
         u.created_at,
         u.updated_at,
         i.name as institution_name
       FROM users u
       LEFT JOIN institutions i ON i.id = u.institution_id
       ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT ${limitInt} OFFSET ${offsetInt}`,
      cleanedValues,
    );

    return NextResponse.json({
      data: rows || [],
      meta: { page: safePage, pageSize: safePageSize, total },
    });
  } catch (error) {
    console.error("Error en listUsersAdminHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
