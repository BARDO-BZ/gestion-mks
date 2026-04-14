import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireInstitutionAccess } from "@/lib/authz";

export async function listEppsHandler(req: NextRequest) {
  try {
    const access = await requireInstitutionAccess(req);
    if (!access.ok) return access.res;

    const user = access.user;

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const institution = searchParams.get("institution") || "";
    const branch = searchParams.get("branch") || "";
    const service = searchParams.get("service") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "default";

    const whereParts: string[] = [];
    const values: any[] = [];

    // Gate por institución para CLIENT
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
        "(e.code LIKE ? OR i.name LIKE ? OR e.branch LIKE ? OR e.service LIKE ? OR e.epp_type LIKE ?)",
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Para la vista "Tareas pendientes": solo EPPs con tareas abiertas O inspección vencida
    if (sortBy === "open_tasks") {
      whereParts.push(`(
        (SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN') > 0
        OR (
          CASE WHEN e.inspection_freq = 'SEMESTRAL' THEN
            NOW() > DATE_ADD(
              COALESCE(
                (SELECT performed_at FROM inspections ins WHERE ins.epp_id = e.id ORDER BY ins.performed_at DESC LIMIT 1),
                STR_TO_DATE(CONCAT(e.fabrication_year,'-',LPAD(e.fabrication_month,2,'0'),'-01'),'%Y-%m-%d')
              ),
              INTERVAL 6 MONTH
            )
          ELSE
            NOW() > DATE_ADD(
              COALESCE(
                (SELECT performed_at FROM inspections ins WHERE ins.epp_id = e.id ORDER BY ins.performed_at DESC LIMIT 1),
                STR_TO_DATE(CONCAT(e.fabrication_year,'-',LPAD(e.fabrication_month,2,'0'),'-01'),'%Y-%m-%d')
              ),
              INTERVAL 12 MONTH
            )
          END
        ) = 1
      )`);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    // total
    const [countRows]: any = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM epps e
       LEFT JOIN institutions i ON i.id = e.institution_id
       ${whereSql}`,
      values,
    );
    const total = countRows[0]?.total ?? 0;

    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const offset = (safePage - 1) * safePageSize;

    // Status priority: TO_DISCARD → RESERVED → APPROVED → DISCARDED → DELETED
    const statusPriority = `CASE e.status
      WHEN 'TO_DISCARD' THEN 1
      WHEN 'RESERVED'   THEN 2
      WHEN 'APPROVED'   THEN 3
      WHEN 'DISCARDED'  THEN 4
      WHEN 'DELETED'    THEN 5
      ELSE 6
    END`;

    const oldestFirst = `
      CASE WHEN e.status IN ('RESERVED','APPROVED') THEN e.fabrication_year  ELSE 0 END ASC,
      CASE WHEN e.status IN ('RESERVED','APPROVED') THEN e.fabrication_month ELSE 0 END ASC`;

    const openTasksSubquery = `(SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN')`;

    const inspectionOverdueExpr = `
      CASE WHEN e.inspection_freq = 'SEMESTRAL' THEN
        NOW() > DATE_ADD(
          COALESCE(
            (SELECT performed_at FROM inspections ins WHERE ins.epp_id = e.id ORDER BY ins.performed_at DESC LIMIT 1),
            STR_TO_DATE(CONCAT(e.fabrication_year,'-',LPAD(e.fabrication_month,2,'0'),'-01'),'%Y-%m-%d')
          ),
          INTERVAL 6 MONTH
        )
      ELSE
        NOW() > DATE_ADD(
          COALESCE(
            (SELECT performed_at FROM inspections ins WHERE ins.epp_id = e.id ORDER BY ins.performed_at DESC LIMIT 1),
            STR_TO_DATE(CONCAT(e.fabrication_year,'-',LPAD(e.fabrication_month,2,'0'),'-01'),'%Y-%m-%d')
          ),
          INTERVAL 12 MONTH
        )
      END
    `;

    let orderBy: string;
    switch (sortBy) {
      // Por institución → sucursal → servicio → tipo EPP → estado
      case "institution":
        orderBy = `i.name ASC, e.branch ASC, e.service ASC, COALESCE(e.epp_type,'') ASC, ${statusPriority} ASC`;
        break;
      // Por sucursal → servicio → tipo EPP → estado
      case "branch":
        orderBy = `e.branch ASC, e.service ASC, COALESCE(e.epp_type,'') ASC, ${statusPriority} ASC`;
        break;
      // Por servicio → tipo EPP → estado
      case "service":
        orderBy = `e.service ASC, COALESCE(e.epp_type,'') ASC, ${statusPriority} ASC`;
        break;
      // Próximas inspecciones → institución → sucursal → estado → tipo EPP → servicio
      case "next_inspection":
        orderBy = `e.caducidad_year ASC, e.caducidad_month ASC, i.name ASC, e.branch ASC, ${statusPriority} ASC, COALESCE(e.epp_type,'') ASC, e.service ASC`;
        break;
      // Tareas pendientes: tareas DESC, luego inspección vencida, luego institución → sucursal → estado
      case "open_tasks":
        orderBy = `${openTasksSubquery} DESC, (${inspectionOverdueExpr}) DESC, i.name ASC, e.branch ASC, ${statusPriority} ASC, COALESCE(e.epp_type,'') ASC, e.service ASC`;
        break;
      default:
        orderBy = `${statusPriority} ASC, ${oldestFirst}, i.name ASC, e.service ASC`;
    }

    const sqlData = `
      SELECT
        e.*,
        i.name AS institution_name,
        ${openTasksSubquery} AS open_tasks_count,
        (${inspectionOverdueExpr}) AS inspection_overdue
      FROM epps e
      LEFT JOIN institutions i ON i.id = e.institution_id
      ${whereSql}
      ORDER BY ${orderBy}
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
