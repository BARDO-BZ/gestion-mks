import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { addEppLog } from "@/features/epps/utils/addEppLog";
import { getAuthUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifyAdmins";

export async function listTasksHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const eppIdNum = Number(eppId);

    // ✅ Gate por institución (seguridad)
    const [eppRows]: any = await connection.execute(
      `SELECT id, institution_id FROM epps WHERE id = ? LIMIT 1`,
      [eppIdNum],
    );

    if (!eppRows?.length) {
      return NextResponse.json(
        { message: "EPP no encontrado" },
        { status: 404 },
      );
    }

    const epp = eppRows[0] as { institution_id: number | null };

    if (user.role !== "admin") {
      if (!user.institution_id) {
        return NextResponse.json(
          { message: "Usuario sin institución" },
          { status: 403 },
        );
      }

      if (epp.institution_id !== user.institution_id) {
        // 404 para no filtrar info
        return NextResponse.json(
          { message: "EPP no encontrado" },
          { status: 404 },
        );
      }
    }

    // 👇 tu query original
    const [rows]: any = await connection.execute(
      `SELECT 
          t.*,
          u.name AS user_name,
          u.last_name AS user_last_name
       FROM epp_tasks t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.epp_id = ?
       ORDER BY 
         CASE WHEN t.status = 'OPEN' THEN 0 ELSE 1 END,
         t.created_at DESC`,
      [eppIdNum],
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error listTasksHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function closeTaskHandler(req: NextRequest, taskId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const idNum = Number(taskId);

    const [rows]: any = await connection.execute(
      `SELECT t.*, e.code AS epp_code FROM epp_tasks t JOIN epps e ON e.id = t.epp_id WHERE t.id = ?`,
      [idNum],
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 },
      );
    }

    const task = rows[0];

    if (task.status === "CLOSED") {
      return NextResponse.json(
        { message: "La tarea ya está cerrada" },
        { status: 200 },
      );
    }

    await connection.execute(
      `UPDATE epp_tasks
       SET status = 'CLOSED',
           closed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [idNum],
    );

    await addEppLog(task.epp_id, user.id, "TASK_CLOSED", {
      taskId: idNum,
      description: task.description,
    });

    await notifyAdmins(
      "TASK_CLOSED",
      `Tarea resuelta en EPP ${task.epp_code}: "${task.description}"`,
      { eppId: task.epp_id, taskId: idNum },
    ).catch(() => {});

    return NextResponse.json({ message: "Tarea cerrada" }, { status: 200 });
  } catch (error) {
    console.error("Error closeTaskHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
