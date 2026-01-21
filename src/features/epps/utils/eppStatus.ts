export type EppStatus =
  | "APPROVED"
  | "RESERVED"
  | "TO_DISCARD"
  | "DISCARDED"
  | "DELETED"
  | string;

export function eppStatusLabel(status: EppStatus): string {
  switch (status) {
    case "APPROVED":
      return "Aprobado";
    case "RESERVED":
      return "Uso bajo reserva";
    case "TO_DISCARD":
      return "A descartar";
    case "DISCARDED":
      return "Descartado";
    case "DELETED":
      return "Eliminado";
    default:
      // fallback: por si hay data legacy o statuses nuevos
      return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
  }
}
