import connection from "@/lib/db";

export async function getActiveAdminRecipients() {
  const [rows]: any = await connection.execute(
    `SELECT email, name, last_name
     FROM users
     WHERE role = 'admin' AND status = 'active'`,
  );

  return (rows || [])
    .map((r: any) => ({
      email: r.email,
      name: `${r.name || ""} ${r.last_name || ""}`.trim(),
    }))
    .filter((r: any) => !!r.email);
}
