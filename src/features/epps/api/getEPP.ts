import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import {
  calculateEppStatus,
  EppDbStatus,
  InspectionFreq,
} from "../utils/calculateEPPStatus";
import { getAuthUser } from "./getAuthUser";

export async function getEppHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Traer EPP
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

    // Última inspección
    const [inspRows]: any = await connection.execute(
      `SELECT performed_at
       FROM inspections
       WHERE epp_id = ?
       ORDER BY performed_at DESC
       LIMIT 1`,
      [eppId]
    );
    const lastInspectionAt =
      inspRows.length > 0 ? inspRows[0].performed_at : null;

    // Tareas abiertas
    const [taskRows]: any = await connection.execute(
      `SELECT COUNT(*) AS open_count
       FROM epp_tasks
       WHERE epp_id = ?
         AND status = 'OPEN'`,
      [eppId]
    );
    const openTasksCount = taskRows[0]?.open_count ?? 0;

    // Calcular estado sugerido
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

    // Logs (como ya lo tenías)
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
