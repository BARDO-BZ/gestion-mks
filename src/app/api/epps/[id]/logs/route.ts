import connection from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    const [rows]: any = await connection.execute(
      `SELECT l.*, u.name AS user_name, u.last_name AS user_last_name
       FROM epp_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.epp_id = ?
       ORDER BY l.created_at DESC`,
      [numericId]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error get logs:", error);
    return NextResponse.json({ error: "Error fetching logs" }, { status: 500 });
  }
}
