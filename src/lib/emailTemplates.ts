const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb;
  margin: 0; padding: 0;
`;

const CARD_STYLE = `
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  margin: 32px auto;
  border: 1px solid #e5e7eb;
`;

const HEADER_STYLE = `
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const SUBTEXT_STYLE = `
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 24px;
`;

const TABLE_STYLE = `
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const TH_STYLE = `
  text-align: left;
  padding: 8px 12px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
`;

const TD_STYLE = `
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
`;

const STATUS_BADGE: Record<string, string> = {
  TO_DISCARD: "background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:9999px;font-size:11px;",
  RESERVED:   "background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:9999px;font-size:11px;",
  APPROVED:   "background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:9999px;font-size:11px;",
  DISCARDED:  "background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:9999px;font-size:11px;",
};

const STATUS_LABELS: Record<string, string> = {
  TO_DISCARD: "A descartar",
  RESERVED:   "Uso bajo reserva",
  APPROVED:   "Aprobado",
  DISCARDED:  "Descartado",
};

function statusBadge(status: string) {
  const style = STATUS_BADGE[status] ?? STATUS_BADGE.DISCARDED;
  const label = STATUS_LABELS[status] ?? status;
  return `<span style="${style}">${label}</span>`;
}

function footer() {
  return `
    <div style="text-align:center;margin-top:32px;font-size:11px;color:#9ca3af;">
      MKS Gestión · Protección Radiológica<br>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://mksargentina.com"}" style="color:#6b7280;">Ir a la aplicación</a>
    </div>
  `;
}

// ─── Tipos de datos ───────────────────────────────────────────────────────────

export interface EppAlertItem {
  code: string;
  institution_name: string;
  branch: string;
  service: string;
  status: string;
  caducidad_month: number;
  caducidad_year: number;
  open_tasks: number;
}

// ─── Template: Notificación diaria ───────────────────────────────────────────

export function dailyNotificationTemplate(items: EppAlertItem[]): { subject: string; html: string } {
  const subject = `[MKS] ${items.length} novedad${items.length !== 1 ? "es" : ""} en EPPs — ${new Date().toLocaleDateString("es-AR")}`;

  const rows = items.map((e) => `
    <tr>
      <td style="${TD_STYLE}">${e.code}</td>
      <td style="${TD_STYLE}">${e.institution_name ?? "—"}</td>
      <td style="${TD_STYLE}">${e.service}</td>
      <td style="${TD_STYLE}">${statusBadge(e.status)}</td>
      <td style="${TD_STYLE}">${e.caducidad_month}/${e.caducidad_year}</td>
      <td style="${TD_STYLE}">${e.open_tasks > 0 ? `⚠ ${e.open_tasks}` : "—"}</td>
    </tr>
  `).join("");

  const html = `
    <body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        <p style="${HEADER_STYLE}">Novedades del día</p>
        <p style="${SUBTEXT_STYLE}">${new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

        <table style="${TABLE_STYLE}">
          <thead>
            <tr>
              <th style="${TH_STYLE}">Código</th>
              <th style="${TH_STYLE}">Institución</th>
              <th style="${TH_STYLE}">Servicio</th>
              <th style="${TH_STYLE}">Estado</th>
              <th style="${TH_STYLE}">Caducidad</th>
              <th style="${TH_STYLE}">Tareas</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        ${footer()}
      </div>
    </body>
  `;

  return { subject, html };
}

// ─── Template: Resumen mensual ────────────────────────────────────────────────

export interface MonthlySummaryData {
  month: string; // "Febrero 2026"
  totalEpps: number;
  byStatus: Array<{ status: string; count: number }>;
  toDiscard: EppAlertItem[];
  reserved: EppAlertItem[];
  pendingTasks: number;
}

export function monthlySummaryTemplate(data: MonthlySummaryData): { subject: string; html: string } {
  const subject = `[MKS] Resumen mensual — ${data.month}`;

  const statusRows = data.byStatus.map((s) => `
    <tr>
      <td style="${TD_STYLE}">${statusBadge(s.status)}</td>
      <td style="${TD_STYLE}; font-weight:600;">${s.count}</td>
      <td style="${TD_STYLE}; color:#9ca3af;">${data.totalEpps > 0 ? Math.round((s.count / data.totalEpps) * 100) : 0}%</td>
    </tr>
  `).join("");

  const alertRows = [...data.toDiscard, ...data.reserved].slice(0, 20).map((e) => `
    <tr>
      <td style="${TD_STYLE}">${e.code}</td>
      <td style="${TD_STYLE}">${e.institution_name ?? "—"}</td>
      <td style="${TD_STYLE}">${e.service}</td>
      <td style="${TD_STYLE}">${statusBadge(e.status)}</td>
      <td style="${TD_STYLE}">${e.caducidad_month}/${e.caducidad_year}</td>
    </tr>
  `).join("");

  const html = `
    <body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        <p style="${HEADER_STYLE}">Resumen mensual · ${data.month}</p>
        <p style="${SUBTEXT_STYLE}">${data.totalEpps} EPPs activos en total · ${data.pendingTasks} tareas pendientes</p>

        <p style="font-size:14px;font-weight:600;color:#374151;margin-bottom:12px;">Distribución por estado</p>
        <table style="${TABLE_STYLE}">
          <thead>
            <tr>
              <th style="${TH_STYLE}">Estado</th>
              <th style="${TH_STYLE}">Cantidad</th>
              <th style="${TH_STYLE}">%</th>
            </tr>
          </thead>
          <tbody>${statusRows}</tbody>
        </table>

        ${(data.toDiscard.length > 0 || data.reserved.length > 0) ? `
          <p style="font-size:14px;font-weight:600;color:#374151;margin:24px 0 12px;">EPPs que requieren atención</p>
          <table style="${TABLE_STYLE}">
            <thead>
              <tr>
                <th style="${TH_STYLE}">Código</th>
                <th style="${TH_STYLE}">Institución</th>
                <th style="${TH_STYLE}">Servicio</th>
                <th style="${TH_STYLE}">Estado</th>
                <th style="${TH_STYLE}">Caducidad</th>
              </tr>
            </thead>
            <tbody>${alertRows}</tbody>
          </table>
        ` : ""}

        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin-top:24px;font-size:13px;color:#0c4a6e;">
          ¿Necesitás soporte técnico o asesoramiento comercial?<br>
          Contactanos en <a href="mailto:info@mksargentina.com" style="color:#0369a1;">info@mksargentina.com</a>
        </div>

        ${footer()}
      </div>
    </body>
  `;

  return { subject, html };
}
