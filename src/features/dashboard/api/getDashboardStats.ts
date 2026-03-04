import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireInstitutionAccess } from "@/lib/authz";

export async function getDashboardStatsHandler(req: NextRequest) {
  try {
    const access = await requireInstitutionAccess(req);
    if (!access.ok) return access.res;

    const user = access.user;
    const isAdmin = user.role === "admin";

    const institutionFilter = isAdmin
      ? ""
      : `AND e.institution_id = ${Number(user.institution_id)}`;

    // 1. Totales por estado (excluye DELETED)
    const [statusRows]: any = await connection.execute(`
      SELECT e.status, COUNT(*) AS count
      FROM epps e
      WHERE e.status != 'DELETED'
      ${institutionFilter}
      GROUP BY e.status
    `);

    // 2. RESERVED breakdown: motivo
    //    - open_tasks: tiene tareas abiertas
    //    - inspection_overdue: inspección vencida (sin tareas)
    //    - both: ambos
    const [reservedRows]: any = await connection.execute(`
      SELECT
        SUM(CASE WHEN open_tasks > 0 AND insp_overdue = 1 THEN 1 ELSE 0 END) AS both_reasons,
        SUM(CASE WHEN open_tasks > 0 AND insp_overdue = 0 THEN 1 ELSE 0 END) AS open_tasks_only,
        SUM(CASE WHEN open_tasks = 0 AND insp_overdue = 1 THEN 1 ELSE 0 END) AS overdue_only
      FROM (
        SELECT
          e.id,
          (SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN') AS open_tasks,
          CASE
            WHEN (
              SELECT performed_at FROM inspections i
              WHERE i.epp_id = e.id
              ORDER BY i.performed_at DESC LIMIT 1
            ) IS NOT NULL THEN
              CASE
                WHEN e.inspection_freq = 'SEMESTRAL' THEN
                  NOW() > DATE_ADD(
                    (SELECT performed_at FROM inspections i WHERE i.epp_id = e.id ORDER BY i.performed_at DESC LIMIT 1),
                    INTERVAL 6 MONTH
                  )
                ELSE
                  NOW() > DATE_ADD(
                    (SELECT performed_at FROM inspections i WHERE i.epp_id = e.id ORDER BY i.performed_at DESC LIMIT 1),
                    INTERVAL 12 MONTH
                  )
              END
            ELSE
              CASE
                WHEN e.inspection_freq = 'SEMESTRAL' THEN
                  NOW() > DATE_ADD(
                    STR_TO_DATE(CONCAT(e.fabrication_year, '-', LPAD(e.fabrication_month, 2, '0'), '-01'), '%Y-%m-%d'),
                    INTERVAL 6 MONTH
                  )
                ELSE
                  NOW() > DATE_ADD(
                    STR_TO_DATE(CONCAT(e.fabrication_year, '-', LPAD(e.fabrication_month, 2, '0'), '-01'), '%Y-%m-%d'),
                    INTERVAL 12 MONTH
                  )
              END
          END AS insp_overdue
        FROM epps e
        WHERE e.status = 'RESERVED'
        ${institutionFilter}
      ) sub
    `);

    // 3. Distribución por institución (top 10, solo admin)
    let institutionRows: any[] = [];
    if (isAdmin) {
      const [rows]: any = await connection.execute(`
        SELECT i.name AS institution, COUNT(*) AS count
        FROM epps e
        LEFT JOIN institutions i ON i.id = e.institution_id
        WHERE e.status != 'DELETED'
        GROUP BY e.institution_id, i.name
        ORDER BY count DESC
        LIMIT 10
      `);
      institutionRows = rows;
    }

    // 4. Distribución por sucursal (top 10)
    const [branchRows]: any = await connection.execute(`
      SELECT e.branch, COUNT(*) AS count
      FROM epps e
      WHERE e.status != 'DELETED'
      ${institutionFilter}
      GROUP BY e.branch
      ORDER BY count DESC
      LIMIT 10
    `);

    // 5. Distribución por servicio (top 10)
    const [serviceRows]: any = await connection.execute(`
      SELECT e.service, COUNT(*) AS count
      FROM epps e
      WHERE e.status != 'DELETED'
      ${institutionFilter}
      GROUP BY e.service
      ORDER BY count DESC
      LIMIT 10
    `);

    // 6. EPPs con caducidad próxima (próximos 60 días)
    const [expiringSoonRows]: any = await connection.execute(`
      SELECT COUNT(*) AS count
      FROM epps e
      WHERE e.status NOT IN ('DELETED','DISCARDED','TO_DISCARD')
      AND STR_TO_DATE(CONCAT(e.caducidad_year, '-', LPAD(e.caducidad_month, 2, '0'), '-01'), '%Y-%m-%d')
          BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)
      ${institutionFilter}
    `);

    return NextResponse.json({
      byStatus: statusRows,
      reservedBreakdown: reservedRows[0] ?? { both_reasons: 0, open_tasks_only: 0, overdue_only: 0 },
      byInstitution: institutionRows,
      byBranch: branchRows,
      byService: serviceRows,
      expiringSoon: expiringSoonRows[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Error en getDashboardStatsHandler:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
