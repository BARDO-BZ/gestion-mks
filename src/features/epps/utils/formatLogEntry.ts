import { eppStatusLabel } from "./eppStatus";

export function logTypeLabel(type: string): string {
  switch (type) {
    case "CREATE":
      return "Creación";
    case "STATUS_CHANGE":
      return "Cambio de estado";
    case "INSPECTION":
      return "Inspección";
    case "TASK_CLOSED":
      return "Tarea resuelta";
    case "EDIT":
      return "Edición";
    default:
      return type;
  }
}

export function formatLogDetails(type: string, details: unknown): string {
  if (!details) return "";

  let d: any;
  try {
    d = typeof details === "string" ? JSON.parse(details) : details;
  } catch {
    return typeof details === "string" ? details : "";
  }

  switch (type) {
    case "CREATE":
      return d.action === "IMPORT"
        ? "EPP importado desde planilla"
        : "EPP creado manualmente";

    case "STATUS_CHANGE": {
      if (d.reason === "INSPECTION_DEFECT") {
        return `Pasa a "${eppStatusLabel("RESERVED")}" por defecto detectado en inspección`;
      }
      const to = eppStatusLabel(d.to);
      if (d.from) {
        const from = eppStatusLabel(d.from);
        const suffix = d.mode === "COMPUTED" ? " (automático)" : "";
        return `${from} → ${to}${suffix}`;
      }
      return `→ ${to}`;
    }

    case "INSPECTION": {
      const blindaje = d.blindaje_status === "OK" ? "OK" : "Defectuoso";
      const externa = d.externa_status === "OK" ? "OK" : "Defectuosa";
      let text = `Blindaje: ${blindaje} · Integridad externa: ${externa}`;
      if (d.created_task_id) text += " · Se generó tarea de seguimiento";
      return text;
    }

    case "TASK_CLOSED":
      return d.description ? `"${d.description}"` : "Tarea completada";

    case "EDIT": {
      const fields: string[] = d.fields ?? [];
      return fields.length > 0 ? `Campos actualizados: ${fields.join(", ")}` : "Datos del EPP actualizados";
    }

    default:
      return JSON.stringify(d);
  }
}
