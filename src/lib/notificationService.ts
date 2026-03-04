import connection from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  dailyNotificationTemplate,
  monthlySummaryTemplate,
  EppAlertItem,
} from "@/lib/emailTemplates";

// Obtiene los admins con email
async function getAdminEmails(): Promise<string[]> {
  const [rows]: any = await connection.execute(
    `SELECT email FROM users WHERE role = 'admin' AND status = 'active'`,
  );
  return rows.map((r: any) => r.email as string);
}

// ─── Notificación diaria ──────────────────────────────────────────────────────
// Envía solo si hay EPPs en TO_DISCARD, RESERVED con tareas abiertas,
// o con caducidad en los próximos 30 días.

export async function sendDailyNotification(): Promise<{ sent: boolean; count: number }> {
  const [rows]: any = await connection.execute(`
    SELECT
      e.code,
      i.name AS institution_name,
      e.branch,
      e.service,
      e.status,
      e.caducidad_month,
      e.caducidad_year,
      (SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN') AS open_tasks
    FROM epps e
    LEFT JOIN institutions i ON i.id = e.institution_id
    WHERE e.status NOT IN ('DELETED','DISCARDED')
      AND (
        e.status = 'TO_DISCARD'
        OR (e.status = 'RESERVED')
        OR STR_TO_DATE(
             CONCAT(e.caducidad_year,'-',LPAD(e.caducidad_month,2,'0'),'-01'),
             '%Y-%m-%d'
           ) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      )
    ORDER BY
      CASE e.status WHEN 'TO_DISCARD' THEN 1 WHEN 'RESERVED' THEN 2 ELSE 3 END,
      e.caducidad_year ASC, e.caducidad_month ASC
    LIMIT 100
  `);

  const items: EppAlertItem[] = rows.map((r: any) => ({
    ...r,
    open_tasks: Number(r.open_tasks),
  }));

  if (items.length === 0) return { sent: false, count: 0 };

  const emails = await getAdminEmails();
  if (emails.length === 0) return { sent: false, count: 0 };

  const { subject, html } = dailyNotificationTemplate(items);

  for (const to of emails) {
    await sendEmail({ to, subject, html });
  }

  return { sent: true, count: items.length };
}

// ─── Resumen mensual ──────────────────────────────────────────────────────────

export async function sendMonthlySummary(): Promise<{ sent: boolean }> {
  // Totales por estado
  const [statusRows]: any = await connection.execute(`
    SELECT status, COUNT(*) AS count
    FROM epps
    WHERE status != 'DELETED'
    GROUP BY status
  `);

  const totalEpps = statusRows.reduce((s: number, r: any) => s + Number(r.count), 0);

  // TO_DISCARD items
  const [toDiscardRows]: any = await connection.execute(`
    SELECT e.code, i.name AS institution_name, e.branch, e.service,
           e.status, e.caducidad_month, e.caducidad_year,
           (SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN') AS open_tasks
    FROM epps e
    LEFT JOIN institutions i ON i.id = e.institution_id
    WHERE e.status = 'TO_DISCARD'
    ORDER BY e.caducidad_year ASC, e.caducidad_month ASC
    LIMIT 50
  `);

  // RESERVED items
  const [reservedRows]: any = await connection.execute(`
    SELECT e.code, i.name AS institution_name, e.branch, e.service,
           e.status, e.caducidad_month, e.caducidad_year,
           (SELECT COUNT(*) FROM epp_tasks t WHERE t.epp_id = e.id AND t.status = 'OPEN') AS open_tasks
    FROM epps e
    LEFT JOIN institutions i ON i.id = e.institution_id
    WHERE e.status = 'RESERVED'
    ORDER BY e.caducidad_year ASC, e.caducidad_month ASC
    LIMIT 50
  `);

  // Tareas pendientes totales
  const [taskRows]: any = await connection.execute(
    `SELECT COUNT(*) AS count FROM epp_tasks WHERE status = 'OPEN'`,
  );
  const pendingTasks = Number(taskRows[0]?.count ?? 0);

  const now = new Date();
  const month = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

  const emails = await getAdminEmails();
  if (emails.length === 0) return { sent: false };

  const { subject, html } = monthlySummaryTemplate({
    month: monthCapitalized,
    totalEpps,
    byStatus: statusRows.map((r: any) => ({ status: r.status, count: Number(r.count) })),
    toDiscard: toDiscardRows,
    reserved: reservedRows,
    pendingTasks,
  });

  for (const to of emails) {
    await sendEmail({ to, subject, html });
  }

  return { sent: true };
}
