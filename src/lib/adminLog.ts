import connection from "@/lib/db";

export async function logAdminAction(params: {
  adminId: number;
  action: string;
  targetType: string;
  targetId: number;
  details?: Record<string, unknown>;
}) {
  try {
    await connection.execute(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        params.adminId,
        params.action,
        params.targetType,
        params.targetId,
        params.details ? JSON.stringify(params.details) : null,
      ],
    );
  } catch (e) {
    // No bloquear la respuesta principal si falla el log
    console.error("Error en logAdminAction:", e);
  }
}
