import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import {
  calculateEppStatus,
  EppDbStatus,
  InspectionFreq,
} from "../utils/calculateEPPStatus";
import { addEppLog } from "../utils/addEppLog";
import { getAuthUser } from "@/lib/auth";

const ALLOWED_STATUSES: EppDbStatus[] = [
  "APPROVED",
  "RESERVED",
  "TO_DISCARD",
  "DISCARDED",
];

interface Body {
  useComputed?: boolean;
  status?: EppDbStatus;
}

export async function updateEppStatusHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const useComputed = body.useComputed ?? true;

    // Traer EPP
    const [eppRows]: any = await connection.execute(
      `SELECT *
       FROM epps
       WHERE id = ?`,
      [eppId],
    );

    if (!eppRows || eppRows.length === 0) {
      return NextResponse.json(
        { message: "EPP no encontrado" },
        { status: 404 },
      );
    }

    const epp = eppRows[0] as any;
    const currentStatus = epp.status as EppDbStatus;

    let newStatus: EppDbStatus;

    if (useComputed) {
      // Última inspección
      const [inspRows]: any = await connection.execute(
        `SELECT performed_at
         FROM inspections
         WHERE epp_id = ?
         ORDER BY performed_at DESC
         LIMIT 1`,
        [eppId],
      );
      const lastInspectionAt =
        inspRows.length > 0 ? inspRows[0].performed_at : null;

      // Tareas abiertas
      const [taskRows]: any = await connection.execute(
        `SELECT COUNT(*) AS open_count
         FROM epp_tasks
         WHERE epp_id = ?
           AND status = 'OPEN'`,
        [eppId],
      );
      const openTasksCount = taskRows[0]?.open_count ?? 0;

      const { computedStatus } = calculateEppStatus({
        status: currentStatus,
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

      newStatus = computedStatus;
    } else {
      if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { message: "Estado inválido" },
          { status: 400 },
        );
      }
      newStatus = body.status;
    }

    if (newStatus === currentStatus) {
      return NextResponse.json(
        { message: "El estado ya está actualizado", status: currentStatus },
        { status: 200 },
      );
    }

    await connection.execute(
      `UPDATE epps
       SET status = ?
       WHERE id = ?`,
      [newStatus, eppId],
    );

    await addEppLog(Number(eppId), user.id, "STATUS_CHANGE", {
      from: currentStatus,
      to: newStatus,
      mode: useComputed ? "COMPUTED" : "MANUAL",
    });

    return NextResponse.json(
      { message: "Estado actualizado", status: newStatus },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updateEppStatusHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
