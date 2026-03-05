import connection from "@/lib/db";

export async function notifyAdmins(
  type: string,
  message: string,
  data?: Record<string, unknown>,
) {
  const [admins]: any = await connection.execute(
    `SELECT id FROM users WHERE role = 'admin' AND status = 'active'`,
  );

  if (!admins || admins.length === 0) return;

  const values = admins.map(() => "(?, ?, ?, ?)").join(", ");
  const params = admins.flatMap((a: any) => [
    a.id,
    type,
    message,
    data ? JSON.stringify(data) : null,
  ]);

  await connection.execute(
    `INSERT INTO notifications (user_id, type, message, data) VALUES ${values}`,
    params,
  );
}
