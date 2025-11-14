import connection from "@/lib/db";

export async function addEppLog(
  eppId: number,
  userId: number | null,
  type: string,
  details: any = {}
) {
  await connection.execute(
    `INSERT INTO epp_logs (epp_id, user_id, type, details)
     VALUES (?, ?, ?, ?)`,
    [eppId, userId, type, details ? JSON.stringify(details) : null]
  );
}
