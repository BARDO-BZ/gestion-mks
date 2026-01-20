"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import type {
  AdminInstitutionRow,
  InstitutionStatus,
} from "@/features/institutions/api/admin/listInstitutions";

const statusLabel: Record<InstitutionStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
};

export function AdminInstitutionsTable(props: {
  rows: AdminInstitutionRow[];
  busyId: number | null;
  onRename: (id: number, name: string) => Promise<void>;
  onToggleStatus: (id: number, next: InstitutionStatus) => Promise<void>;
}) {
  const { rows, busyId, onRename, onToggleStatus } = props;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  const columns = useMemo(
    () => [
      { key: "name", label: "NOMBRE" },
      { key: "status", label: "ESTADO" },
      { key: "users", label: "USUARIOS" },
      { key: "epps", label: "EPPS" },
      { key: "created", label: "CREADA" },
      { key: "actions", label: "ACCIONES" },
    ],
    [],
  );

  const startEdit = (r: AdminInstitutionRow) => {
    setEditingId(r.id);
    setDraftName(r.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveEdit = async (id: number) => {
    const name = draftName.trim();
    if (!name) return;
    await onRename(id, name);
    cancelEdit();
  };

  return (
    <Table aria-label="Tabla de instituciones">
      <TableHeader columns={columns}>
        {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
      </TableHeader>

      <TableBody emptyContent="No hay instituciones para mostrar">
        {rows.map((r) => {
          const isEditing = editingId === r.id;
          const isBusy = busyId === r.id;

          return (
            <TableRow key={r.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-default-400">#{r.id}</span>

                  {isEditing ? (
                    <Input
                      size="sm"
                      value={draftName}
                      onValueChange={setDraftName}
                      isDisabled={isBusy}
                    />
                  ) : (
                    <span className="font-medium">{r.name}</span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={r.status === "active" ? "success" : "default"}
                >
                  {statusLabel[r.status]}
                </Chip>
              </TableCell>

              <TableCell>{r.users_count ?? 0}</TableCell>
              <TableCell>{r.epps_count ?? 0}</TableCell>

              <TableCell className="text-default-500 text-sm">
                {new Date(r.created_at).toLocaleDateString()}
              </TableCell>

              <TableCell>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        color="primary"
                        onPress={() => saveEdit(r.id)}
                        isDisabled={isBusy || !draftName.trim()}
                      >
                        Guardar
                      </Button>
                      <Button size="sm" variant="light" onPress={cancelEdit}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="bordered"
                        onPress={() => startEdit(r)}
                        isDisabled={isBusy}
                      >
                        Editar
                      </Button>

                      {r.status === "active" ? (
                        <Button
                          size="sm"
                          variant="bordered"
                          onPress={() => onToggleStatus(r.id, "inactive")}
                          isDisabled={isBusy}
                        >
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => onToggleStatus(r.id, "active")}
                          isDisabled={isBusy}
                        >
                          Activar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
