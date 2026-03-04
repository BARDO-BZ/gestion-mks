import connection from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function isRateLimited(ip: string): Promise<boolean> {
  try {
    const [rows]: any = await connection.execute(
      `SELECT COUNT(*) AS count FROM login_attempts
       WHERE ip = ? AND attempted_at > NOW() - INTERVAL ${WINDOW_MINUTES} MINUTE`,
      [ip],
    );
    return Number(rows[0]?.count ?? 0) >= MAX_ATTEMPTS;
  } catch {
    return false; // si falla el check, no bloqueamos
  }
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  try {
    await connection.execute(
      `INSERT INTO login_attempts (ip) VALUES (?)`,
      [ip],
    );
  } catch (e) {
    console.error("Error registrando intento de login:", e);
  }
}
