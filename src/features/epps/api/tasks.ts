import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import jwt from "jsonwebtoken";
import { IJWTPayload } from "@/features/users/interfaces";
import { addEppLog } from "@/features/epps/utils/addEppLog";

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

    const [rows]: any = await connection.execute(
      `SELECT id, email, name, last_name, role, status
       FROM users
       WHERE id = ? AND status = "active"`,
      [decoded.userId]
    );

    if (!rows || rows.length === 0) return null;
    return rows[0];
  } catch {
    return null;
  }
}

export async function listTasksHandler(req: NextRequest, eppId: string) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

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
      [Number(eppId)]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error listTasksHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
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
      `SELECT * FROM epp_tasks WHERE id = ?`,
      [idNum]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    const task = rows[0];

    if (task.status === "CLOSED") {
      return NextResponse.json(
        { message: "La tarea ya está cerrada" },
        { status: 200 }
      );
    }

    await connection.execute(
      `UPDATE epp_tasks
       SET status = 'CLOSED',
           closed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [idNum]
    );

    await addEppLog(task.epp_id, user.id, "TASK_CLOSED", {
      taskId: idNum,
      description: task.description,
    });

    return NextResponse.json({ message: "Tarea cerrada" }, { status: 200 });
  } catch (error) {
    console.error("Error closeTaskHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
