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
import { EppEditForm } from "./EppEditForm";
import { EppLogs } from "./EppLogs";
import { useAuth } from "@/contexts/AuthContext";

interface Epp {
  id: number;
  code: string;
  institution_id: number;
  institution_name?: string | null;
  institution?: string | null; // legacy fallback
  branch: string;
  service: string;
  epp_type?: string | null;
  details?: string | null;
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

interface Props {
  id: string;
}

export function EppDetailView({ id }: Props) {
  const router = useRouter();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [epp, setEpp] = useState<Epp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [inspectionsKey, setInspectionsKey] = useState(0);
  const [logsKey, setLogsKey] = useState(0);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);

  const [tasksKey, setTasksKey] = useState(0);
  const handleTaskUpdated = () => {
    setTasksKey((prev) => prev + 1);
    setLogsKey((prev) => prev + 1);
    fetchEpp();
  };

  const handleInspectionCreated = () => {
    setInspectionsKey((prev) => prev + 1);
    setLogsKey((prev) => prev + 1);
    fetchEpp();
  };

  const handleDiscard = async () => {
    if (!confirm("¿Confirmás que querés marcar este EPP como Descartado? Esta acción es manual y quedará registrada.")) return;
    setDiscarding(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/epps/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useComputed: false, status: "DISCARDED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al actualizar el estado");
      }
      await fetchEpp();
    } catch (err: any) {
      setStatusError(err.message ?? "Error inesperado");
    } finally {
      setDiscarding(false);
    }
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
        <div className="flex gap-2">
          <Button variant="flat" onPress={onEditOpen}>
            Editar
          </Button>
          <Button variant="light" onPress={() => router.back()}>
            Volver al listado
          </Button>
        </div>
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

              <div className="flex flex-col gap-2">
                {needsStatusUpdate && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={handleApplySuggestedStatus}
                    isDisabled={updatingStatus || discarding}
                  >
                    {updatingStatus
                      ? "Actualizando..."
                      : "Aplicar estado sugerido"}
                  </Button>
                )}
                {epp.status !== "DISCARDED" && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={handleDiscard}
                    isDisabled={discarding || updatingStatus}
                  >
                    {discarding ? "Descartando..." : "Marcar como Descartado"}
                  </Button>
                )}
              </div>
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
              <span className="font-semibold">Tipo de EPP</span>
              <span>{epp.epp_type || "—"}</span>
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
            {epp.details && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="font-semibold">Detalles</span>
                <span className="whitespace-pre-wrap">{epp.details}</span>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Actividad</p>
          <EppLogs key={logsKey} id={id} />
        </div>
      </div>

      {/* Inspecciones - full width */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Inspecciones</h2>
          <Button color="primary" onPress={onOpen}>
            Nueva inspección
          </Button>
        </div>
        <EppInspectionsList eppId={id} refreshKey={inspectionsKey} />
      </div>

      {/* Tareas - full width */}
      <div className="flex flex-col gap-3">
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

      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Editar EPP
              </ModalHeader>
              <ModalBody>
                <EppEditForm
                  epp={epp}
                  onUpdated={() => { fetchEpp(); close(); }}
                  onClose={close}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
