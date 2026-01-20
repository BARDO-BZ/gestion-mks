import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function listEppsHandler(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    // 👇 este filtro ahora se interpreta como "nombre institución"
    const institution = searchParams.get("institution") || "";
    const branch = searchParams.get("branch") || "";
    const service = searchParams.get("service") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const whereParts: string[] = [];
    const values: any[] = [];

    // ✅ Gate por institución para CLIENT
    if (user.role !== "admin") {
      if (!user.institution_id) {
        return NextResponse.json(
          { message: "Usuario sin institución" },
          { status: 403 },
        );
      }
      whereParts.push("e.institution_id = ?");
      values.push(user.institution_id);
    }

    // ✅ Filtros
    // institution -> ahora filtra por nombre de institutions (JOIN)
    if (institution) {
      whereParts.push("i.name LIKE ?");
      values.push(`%${institution}%`);
    }
    if (branch) {
      whereParts.push("e.branch LIKE ?");
      values.push(`%${branch}%`);
    }
    if (service) {
      whereParts.push("e.service LIKE ?");
      values.push(`%${service}%`);
    }
    if (status) {
      whereParts.push("e.status = ?");
      values.push(status);
    }
    if (search) {
      whereParts.push(
        "(e.code LIKE ? OR i.name LIKE ? OR e.branch LIKE ? OR e.service LIKE ?)",
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    // total
    const [countRows]: any = await connection.execute(
      `
      SELECT COUNT(*) as total
      FROM epps e
      LEFT JOIN institutions i ON i.id = e.institution_id
      ${whereSql}
      `,
      values,
    );
    const total = countRows[0]?.total ?? 0;

    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const offset = (safePage - 1) * safePageSize;

    const sqlData = `
      SELECT
        e.*,
        i.name AS institution_name
      FROM epps e
      LEFT JOIN institutions i ON i.id = e.institution_id
      ${whereSql}
      ORDER BY e.created_at DESC
      LIMIT ${safePageSize} OFFSET ${offset}
    `;

    const [rows]: any = await connection.execute(sqlData, values);

    return NextResponse.json({
      data: rows,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.ceil(total / safePageSize),
      },
    });
  } catch (error) {
    console.error("Error en listEppsHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
