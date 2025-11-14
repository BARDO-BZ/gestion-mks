export type EppDbStatus = "APPROVED" | "RESERVED" | "TO_DISCARD" | "DISCARDED";

export type InspectionFreq = "ANNUAL" | "SEMESTRAL";

interface CalculateStatusInput {
  status: EppDbStatus;
  fabrication_year: number;
  fabrication_month: number;
  caducidad_year: number;
  caducidad_month: number;
  inspection_freq: InspectionFreq;
  lastInspectionAt?: string | null;
  openTasksCount: number;
}

export interface CalculatedStatusResult {
  computedStatus: EppDbStatus;
  inspectionOverdue: boolean;
  nextInspectionDate: string | null;
}

export function calculateEppStatus(
  input: CalculateStatusInput
): CalculatedStatusResult {
  const {
    status,
    fabrication_year,
    fabrication_month,
    caducidad_year,
    caducidad_month,
    inspection_freq,
    lastInspectionAt,
    openTasksCount,
  } = input;

  const now = new Date();

  const fabricationDate = new Date(
    fabrication_year,
    (fabrication_month || 1) - 1,
    1
  );
  const caducidadDate = new Date(caducidad_year, (caducidad_month || 1) - 1, 1);

  const caducidadPlus12 = new Date(
    caducidadDate.getFullYear(),
    caducidadDate.getMonth() + 12,
    1
  );

  const referenceInspectionDate = lastInspectionAt
    ? new Date(lastInspectionAt)
    : fabricationDate;

  const monthsToAdd = inspection_freq === "ANNUAL" ? 12 : 6;

  const nextInspection = new Date(
    referenceInspectionDate.getFullYear(),
    referenceInspectionDate.getMonth() + monthsToAdd,
    1
  );

  const inspectionOverdue = now > nextInspection;
  const hasOpenTasks = openTasksCount > 0;

  // Si el usuario ya lo marcó como descartado, respetamos eso
  if (status === "DISCARDED") {
    return {
      computedStatus: "DISCARDED",
      inspectionOverdue,
      nextInspectionDate: nextInspection.toISOString(),
    };
  }

  // Si el usuario lo marcó "a descartar", también respetamos
  if (status === "TO_DISCARD") {
    return {
      computedStatus: "TO_DISCARD",
      inspectionOverdue,
      nextInspectionDate: nextInspection.toISOString(),
    };
  }

  // Si ya pasó caducidad + 12 meses → A descartar
  if (now > caducidadPlus12) {
    return {
      computedStatus: "TO_DISCARD",
      inspectionOverdue,
      nextInspectionDate: nextInspection.toISOString(),
    };
  }

  // Si hay tareas abiertas o inspección vencida o fecha > caducidad → Uso bajo reserva
  if (hasOpenTasks || inspectionOverdue || now > caducidadDate) {
    return {
      computedStatus: "RESERVED",
      inspectionOverdue,
      nextInspectionDate: nextInspection.toISOString(),
    };
  }

  // Caso “sano”: aprobado
  return {
    computedStatus: "APPROVED",
    inspectionOverdue,
    nextInspectionDate: nextInspection.toISOString(),
  };
}
