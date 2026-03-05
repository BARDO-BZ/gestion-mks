"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { EppTasksList } from "./EppTasksList";
import { EppInspectionsList } from "./EppInspectionsList";
import { EppInspectionForm } from "./EppInspectionForm";
import { EppLogs } from "./EppLogs";
import { useAuth } from "@/contexts/AuthContext";
import { logTypeLabel, formatLogDetails } from "@/features/epps/utils/formatLogEntry";

interface Epp {
  id: number;
  code: string;
  institution_id: number;
  institution_name?: string | null;
  institution?: string | null; // legacy fallback
  branch: string;
  service: string;
  fabrication_month: number;
  fabrication_year: number;
  caducidad_month: number;
  caducidad_year: number;
  caducidad_years: number;
  inspection_freq: "ANNUAL" | "SEMESTRAL";
  status: "APPROVED" | "RESERVED" | "TO_DISCARD" | "DISCARDED";
  created_at: string;
  updated_at: string;

  computed_status?: Epp["status"];
  needs_status_update?: boolean;
  inspection_overdue?: boolean;
  next_inspection_at?: string | null;
  open_tasks_count?: number;
  last_inspection_at?: string | null;
}

interface EppLog {
  id: number;
  type: string;
  details: any;
  created_at: string;
}

interface Props {
  id: string;
}

export function EppDetailView({ id }: Props) {
  const router = useRouter();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [epp, setEpp] = useState<Epp | null>(null);
  const [logs, setLogs] = useState<EppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inspectionsKey, setInspectionsKey] = useState(0);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [tasksKey, setTasksKey] = useState(0);
  const handleTaskUpdated = () => {
    setTasksKey((prev) => prev + 1);
    fetchEpp(); // para refrescar estado y actividad reciente
  };

  const handleInspectionCreated = () => {
    // refresca inspecciones
    setInspectionsKey((prev) => prev + 1);
    // refresca EPP (estado) y logs
    fetchEpp();
  };

  const handleApplySuggestedStatus = async () => {
    if (!epp?.computed_status) return;
    setUpdatingStatus(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/epps/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useComputed: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al actualizar el estado");
      }

      await fetchEpp();
    } catch (err: any) {
      console.error(err);
      setStatusError(err.message ?? "Error inesperado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchEpp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/epps/${id}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al obtener el EPP");
      }

      const data = await res.json();
      setEpp(data.epp);
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Spinner label="Cargando EPP..." />
      </div>
    );
  }

  if (error || !epp) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Detalle de EPP</h1>
          <Button variant="light" onPress={() => router.push("/epp")}>
            Volver al listado
          </Button>
        </div>
        <p className="text-red-500 text-sm">
          {error || "No se encontró el EPP."}
        </p>
      </div>
    );
  }

  const statusLabelMap: Record<Epp["status"], string> = {
    APPROVED: "Aprobado",
    RESERVED: "Uso bajo reserva",
    TO_DISCARD: "A descartar",
    DISCARDED: "Descartado",
  };

  const fabricationLabel = `${epp.fabrication_month}/${epp.fabrication_year}`;
  const caducidadLabel = `${epp.caducidad_month}/${epp.caducidad_year}`;
  const inspectionLabel =
    epp.inspection_freq === "ANNUAL" ? "Anual" : "Semestral";

  const computedStatus = epp.computed_status ?? epp.status;
  const needsStatusUpdate = epp.needs_status_update;
  const openTasksCount = epp.open_tasks_count ?? 0;
  const inspectionOverdue = epp.inspection_overdue;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          EPP #{epp.id} – {epp.code}
        </h1>
        <Button variant="light" onPress={() => router.push("/epp")}>
          Volver al listado
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-default-400">
                Estado actual (guardado)
              </p>
              <p className="text-lg font-semibold">
                {statusLabelMap[epp.status]}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-default-100">
                  Estado calculado:{" "}
                  <span className="font-semibold">
                    {statusLabelMap[computedStatus]}
                  </span>
                </span>

                {needsStatusUpdate && (
                  <span className="px-2 py-1 rounded-full bg-warning-100 text-warning-700">
                    Sugerencia: actualizar estado
                  </span>
                )}

                {inspectionOverdue && (
                  <span className="px-2 py-1 rounded-full bg-danger-100 text-danger-700">
                    Inspección vencida
                  </span>
                )}

                {openTasksCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-warning-100 text-warning-700">
                    Tareas abiertas: {openTasksCount}
                  </span>
                )}
              </div>

              {statusError && (
                <p className="text-xs text-red-500 mt-2">{statusError}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 text-right text-sm text-default-400">
              <div>
                <p>Creado: {new Date(epp.created_at).toLocaleString()}</p>
                <p>Actualizado: {new Date(epp.updated_at).toLocaleString()}</p>
                {epp.last_inspection_at && (
                  <p>
                    Última inspección:{" "}
                    {new Date(epp.last_inspection_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {needsStatusUpdate && (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={handleApplySuggestedStatus}
                  isDisabled={updatingStatus}
                >
                  {updatingStatus
                    ? "Actualizando..."
                    : "Aplicar estado sugerido"}
                </Button>
              )}
            </div>
          </CardHeader>

          <Divider />
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Código / Nº de serie</span>
              <span>{epp.code}</span>
            </div>
            {isAdmin && (
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Institución</span>
                <span>{epp.institution_name ?? "-"}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="font-semibold">Sucursal</span>
              <span>{epp.branch}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Servicio</span>
              <span>{epp.service}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Fabricación</span>
              <span>{fabricationLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Caducidad</span>
              <span>
                {caducidadLabel} ({epp.caducidad_years} años)
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Frecuencia de inspección</span>
              <span>{inspectionLabel}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-semibold text-sm">Actividad reciente</p>
          </CardHeader>
          <Divider />
          <CardBody className="text-xs flex flex-col gap-2 max-h-[260px] overflow-auto">
            {logs.length === 0 && (
              <span className="text-default-400">
                No hay actividad registrada todavía.
              </span>
            )}
            {logs.map((log) => {
              const detail = formatLogDetails(log.type, log.details);
              return (
                <div key={log.id} className="flex flex-col gap-0.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{logTypeLabel(log.type)}</span>
                    <span className="text-default-400 shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {detail && (
                    <span className="text-default-500">{detail}</span>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
        <div className="flex flex-col gap-3 mt-4">
          <h2 className="text-xl font-semibold">Actividad</h2>
          <EppLogs id={id} />
        </div>
        {/* Inspecciones */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inspecciones</h2>
            <Button color="primary" onPress={onOpen}>
              Nueva inspección
            </Button>
          </div>
          <EppInspectionsList eppId={id} refreshKey={inspectionsKey} />
        </div>

        {/* Tareas */}
        <div className="flex flex-col gap-3 mt-4">
          <h2 className="text-xl font-semibold">Tareas</h2>
          <EppTasksList
            eppId={id}
            refreshKey={tasksKey}
            onTaskUpdated={handleTaskUpdated}
          />
        </div>

        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalContent>
            {(close) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Nueva inspección
                </ModalHeader>
                <ModalBody>
                  <EppInspectionForm
                    eppId={id}
                    onCreated={handleInspectionCreated}
                    onClose={close}
                  />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
