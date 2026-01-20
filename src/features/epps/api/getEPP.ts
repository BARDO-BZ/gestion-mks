import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import {
  calculateEppStatus,
  EppDbStatus,
  InspectionFreq,
} from "../utils/calculateEPPStatus";
import { requireInstitutionAccess } from "@/lib/authz";

export async function getEppHandler(req: NextRequest, eppId: string) {
  try {
    const idNum = Number(eppId);

    // 1️⃣ Traer SOLO institution_id para validar acceso
    const [accessRows]: any = await connection.execute(
      "SELECT institution_id FROM epps WHERE id = ?",
      [idNum],
    );

    if (!accessRows?.length) {
      return NextResponse.json(
        { message: "EPP no encontrado" },
        { status: 404 },
      );
    }

    const access = await requireInstitutionAccess(
      req,
      accessRows[0].institution_id,
    );

    if (!access.ok) return access.res;

    // 2️⃣ Traer EPP completo (ya validado el acceso)
    const [eppRows]: any = await connection.execute(
      "SELECT * FROM epps WHERE id = ?",
      [idNum],
    );

    const epp = eppRows[0];

    // 3️⃣ Última inspección
    const [inspRows]: any = await connection.execute(
      `SELECT performed_at
       FROM inspections
       WHERE epp_id = ?
       ORDER BY performed_at DESC
       LIMIT 1`,
      [idNum],
    );

    const lastInspectionAt =
      inspRows.length > 0 ? inspRows[0].performed_at : null;

    // 4️⃣ Tareas abiertas
    const [taskRows]: any = await connection.execute(
      `SELECT COUNT(*) AS open_count
       FROM epp_tasks
       WHERE epp_id = ?
         AND status = 'OPEN'`,
      [idNum],
    );

    const openTasksCount = taskRows[0]?.open_count ?? 0;

    // 5️⃣ Cálculo de estado
    const { computedStatus, inspectionOverdue, nextInspectionDate } =
      calculateEppStatus({
        status: epp.status as EppDbStatus,
        fabrication_year: epp.fabrication_year,
        fabrication_month: epp.fabrication_month,
        caducidad_year: epp.caducidad_year,
        caducidad_month: epp.caducidad_month,
        inspection_freq: epp.inspection_freq as InspectionFreq,
        lastInspectionAt: lastInspectionAt
          ? new Date(lastInspectionAt).toISOString()
          : null,
        openTasksCount,
      });

    const needsStatusUpdate = computedStatus !== epp.status;

    // 6️⃣ Logs
    const [logRows]: any = await connection.execute(
      `SELECT id, type, details, created_at
       FROM epp_logs
       WHERE epp_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [idNum],
    );

    return NextResponse.json(
      {
        epp: {
          ...epp,
          computed_status: computedStatus,
          needs_status_update: needsStatusUpdate,
          inspection_overdue: inspectionOverdue,
          next_inspection_at: nextInspectionDate,
          open_tasks_count: openTasksCount,
          last_inspection_at: lastInspectionAt,
        },
        logs: logRows,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en getEppHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
