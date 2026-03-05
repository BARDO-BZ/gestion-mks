import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireAuth } from "@/lib/authz/requireAuth";

// GET /api/notifications — lista notificaciones del usuario autenticado
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const [rows]: any = await connection.execute(
    `SELECT id, type, message, data, read_at, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [auth.user.id],
  );

  const unreadCount = rows.filter((r: any) => !r.read_at).length;

  return NextResponse.json({ data: rows, unreadCount });
}

// POST /api/notifications/read-all — marca todas como leídas
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  await connection.execute(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
    [auth.user.id],
  );

  return NextResponse.json({ ok: true });
}
