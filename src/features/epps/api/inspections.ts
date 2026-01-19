import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { addEppLog } from "@/features/epps/utils/addEppLog";
import { getAuthUser } from "@/lib/auth";

type StatusFlag = "OK" | "DEFECTUOSO";

interface CreateInspectionBody {
  blindaje_status: StatusFlag;
  blindaje_comment?: string;
  externa_status: StatusFlag;
  externa_comment?: string;
  create_task?: boolean;
  task_description?: string;
}

export async function listInspectionsHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const [rows]: any = await connection.execute(
      `SELECT i.*, u.name AS user_name, u.last_name AS user_last_name
       FROM inspections i
       LEFT JOIN users u ON i.performed_by = u.id
       WHERE i.epp_id = ?
       ORDER BY i.performed_at DESC`,
      [Number(eppId)],
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error listInspectionsHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function createInspectionHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as CreateInspectionBody;

    const valid: StatusFlag[] = ["OK", "DEFECTUOSO"];
    if (
      !valid.includes(body.blindaje_status) ||
      !valid.includes(body.externa_status)
    ) {
      return NextResponse.json(
        { message: "Estados de inspección inválidos" },
        { status: 400 },
      );
    }

    // Insertar inspección
    const [result]: any = await connection.execute(
      `INSERT INTO inspections
       (epp_id, performed_by, blindaje_status, blindaje_comment,
        externa_status, externa_comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(eppId),
        user.id,
        body.blindaje_status,
        body.blindaje_comment || null,
        body.externa_status,
        body.externa_comment || null,
      ],
    );

    const inspectionId = Number(result.insertId);

    // Si pide crear tarea y hay defecto externo
    let taskId: number | null = null;
    if (
      body.create_task &&
      body.task_description &&
      body.externa_status === "DEFECTUOSO"
    ) {
      const [taskResult]: any = await connection.execute(
        `INSERT INTO epp_tasks
         (epp_id, inspection_id, description, status, created_by)
         VALUES (?, ?, ?, 'OPEN', ?)`,
        [Number(eppId), inspectionId, body.task_description, user.id],
      );
      taskId = Number(taskResult.insertId);
    }

    // Si hay algún defecto → pasar a Uso bajo reserva
    if (
      body.blindaje_status === "DEFECTUOSO" ||
      body.externa_status === "DEFECTUOSO"
    ) {
      await connection.execute(
        `UPDATE epps
         SET status = 'RESERVED'
         WHERE id = ?`,
        [Number(eppId)],
      );

      await addEppLog(Number(eppId), user.id, "STATUS_CHANGE", {
        to: "RESERVED",
        reason: "INSPECTION_DEFECT",
        inspectionId,
      });
    }

    // Log de la inspección
    await addEppLog(Number(eppId), user.id, "INSPECTION", {
      inspectionId,
      blindaje_status: body.blindaje_status,
      externa_status: body.externa_status,
      created_task_id: taskId,
    });

    return NextResponse.json(
      {
        inspectionId,
        taskId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error createInspectionHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
