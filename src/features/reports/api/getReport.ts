import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireInstitutionAccess } from "@/lib/authz";
import { eppStatusLabel } from "@/features/epps/utils/eppStatus";

export async function getReportHandler(req: NextRequest) {
  try {
    const access = await requireInstitutionAccess(req);
    if (!access.ok) return access.res;

    const user = access.user;
    const isAdmin = user.role === "admin";

    const { searchParams } = new URL(req.url);
    const institution_id = searchParams.get("institution_id") || "";
    const status = searchParams.get("status") || "";
    const caducidad_from = searchParams.get("caducidad_from") || ""; // YYYY-MM
    const caducidad_to = searchParams.get("caducidad_to") || "";     // YYYY-MM
    const format = searchParams.get("format") || "json";             // json | csv

    const whereParts: string[] = ["e.status != 'DELETED'"];
    const values: any[] = [];

    // Gate por institución para CLIENT
    if (!isAdmin) {
      if (!user.institution_id) {
        return NextResponse.json({ message: "Usuario sin institución" }, { status: 403 });
      }
      whereParts.push("e.institution_id = ?");
      values.push(user.institution_id);
    } else if (institution_id) {
      whereParts.push("e.institution_id = ?");
      values.push(Number(institution_id));
    }

    if (status) {
      whereParts.push("e.status = ?");
      values.push(status);
    }

    if (caducidad_from) {
      const [year, month] = caducidad_from.split("-");
      whereParts.push(
        "(e.caducidad_year > ? OR (e.caducidad_year = ? AND e.caducidad_month >= ?))"
      );
      values.push(Number(year), Number(year), Number(month));
    }

    if (caducidad_to) {
      const [year, month] = caducidad_to.split("-");
      whereParts.push(
        "(e.caducidad_year < ? OR (e.caducidad_year = ? AND e.caducidad_month <= ?))"
      );
      values.push(Number(year), Number(year), Number(month));
    }

    const whereSql = `WHERE ${whereParts.join(" AND ")}`;

    const [rows]: any = await connection.execute(
      `SELECT
         e.code,
         i.name AS institution_name,
         e.branch,
         e.service,
         e.status,
         e.fabrication_month,
         e.fabrication_year,
         e.caducidad_month,
         e.caducidad_year,
         e.inspection_freq,
         (SELECT performed_at FROM inspections ins
          WHERE ins.epp_id = e.id
          ORDER BY ins.performed_at DESC LIMIT 1) AS last_inspection_at,
         (SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN') AS open_tasks
       FROM epps e
       LEFT JOIN institutions i ON i.id = e.institution_id
       ${whereSql}
       ORDER BY
         CASE e.status
           WHEN 'TO_DISCARD' THEN 1 WHEN 'RESERVED' THEN 2
           WHEN 'APPROVED' THEN 3 WHEN 'DISCARDED' THEN 4 ELSE 5
         END,
         e.caducidad_year ASC, e.caducidad_month ASC`,
      values,
    );

    if (format === "csv") {
      const header = [
        "Código", "Institución", "Sucursal", "Servicio", "Estado",
        "Fabricación", "Caducidad", "Frec. Inspección", "Última inspección", "Tareas abiertas",
      ].join(",");

      const csvRows = rows.map((r: any) => [
        r.code,
        `"${(r.institution_name ?? "").replace(/"/g, '""')}"`,
        `"${(r.branch ?? "").replace(/"/g, '""')}"`,
        `"${(r.service ?? "").replace(/"/g, '""')}"`,
        eppStatusLabel(r.status),
        `${r.fabrication_month}/${r.fabrication_year}`,
        `${r.caducidad_month}/${r.caducidad_year}`,
        r.inspection_freq === "SEMESTRAL" ? "Semestral" : "Anual",
        r.last_inspection_at
          ? new Date(r.last_inspection_at).toLocaleDateString("es-AR")
          : "—",
        r.open_tasks,
      ].join(","));

      const csv = [header, ...csvRows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="reporte-epps-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: rows, total: rows.length });
  } catch (error) {
    console.error("Error en getReportHandler:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
