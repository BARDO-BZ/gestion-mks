"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import type {
  AdminInstitutionRow,
  InstitutionStatus,
} from "@/features/institutions/client/admin/listInstitutions";
import { listInstitutions } from "@/features/institutions/client/admin/listInstitutions";
import { createInstitution } from "@/features/institutions/client/admin/createInstitution";
import { updateInstitutionName } from "@/features/institutions/client/admin/updateInstitution";
import { updateInstitutionStatus } from "@/features/institutions/client/admin/updateInstitutionStatus";
import { AdminInstitutionsTable } from "./AdminInstitutionsTable";
import { CreateInstitutionForm } from "./CreateInstitutionForm";

type StatusFilter = InstitutionStatus | "all";

export function AdminInstitutionsView() {
  const [rows, setRows] = useState<AdminInstitutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const debouncedQ = useDebounce(q, 500);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listInstitutions({ q, status });
      setRows(res.data || []);
    } catch (e: any) {
      setError(e.message || "Error inesperado");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, status]);

  const statusOptions = useMemo(
    () => [
      { id: "all", name: "Todas" },
      { id: "active", name: "Activas" },
      { id: "inactive", name: "Inactivas" },
    ],
    [],
  );

  const handleCreate = async (data: {
    name: string;
    status: InstitutionStatus;
  }) => {
    setError(null);
    try {
      await createInstitution(data);
      onClose();
      await load();
    } catch (e: any) {
      setError(e.message || "Error al crear institución");
    }
  };

  const handleRename = async (id: number, name: string, account_number: string | null) => {
    setError(null);
    setBusyId(id);
    try {
      await updateInstitutionName(id, name, account_number);
      await load();
    } catch (e: any) {
      setError(e.message || "Error al editar institución");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (id: number, next: InstitutionStatus) => {
    setError(null);
    setBusyId(id);
    try {
      await updateInstitutionStatus(id, next);
      await load();
    } catch (e: any) {
      setError(e.message || "Error al cambiar status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold">Instituciones</h1>
          <p className="text-sm text-default-500">
            Gestioná instituciones, estado y métricas.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Button color="primary" onPress={onOpen}>
            Nueva institución
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <Input
          className="min-w-[260px]"
          placeholder="Buscar por nombre o ID…"
          value={q}
          onValueChange={setQ}
        />

        <Select
          label="Estado"
          className="min-w-[220px]"
          items={statusOptions}
          selectedKeys={new Set([status])}
          onSelectionChange={(keys) => {
            const key = String(Array.from(keys)[0]) as StatusFilter;
            setStatus(key);
          }}
        >
          {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>

        <Button onPress={load} isDisabled={loading}>
          {loading ? "Cargando..." : "Aplicar filtros"}
        </Button>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner label="Cargando instituciones..." />
        </div>
      ) : (
        <AdminInstitutionsTable
          rows={rows}
          busyId={busyId}
          onRename={handleRename}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Nueva institución</ModalHeader>
              <ModalBody>
                <CreateInstitutionForm
                  onCancel={close}
                  onSubmit={handleCreate}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
