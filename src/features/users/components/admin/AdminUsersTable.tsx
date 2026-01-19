"use client";

import {
  Button,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import type {
  AdminUserRow,
  InstitutionOption,
  UserStatus,
} from "./AdminUsersView";

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  active: "Activo",
  inactive: "Inactivo",
};

export function AdminUsersTable(props: {
  users: AdminUserRow[];
  institutions: InstitutionOption[];
  onApprove: (u: AdminUserRow) => void;
  onUpdateStatus: (userId: number, status: UserStatus) => Promise<void>;
  onUpdateInstitution: (userId: number, institutionId: number) => Promise<void>;
}) {
  const {
    users,
    institutions,
    onApprove,
    onUpdateStatus,
    onUpdateInstitution,
  } = props;

  return (
    <Table aria-label="Tabla de usuarios">
      <TableHeader>
        <TableColumn>Email</TableColumn>
        <TableColumn>Nombre</TableColumn>
        <TableColumn>Rol</TableColumn>
        <TableColumn>Estado</TableColumn>
        <TableColumn>Institución</TableColumn>
        <TableColumn>Acciones</TableColumn>
      </TableHeader>

      <TableBody emptyContent="No hay usuarios para mostrar">
        {users.map((u) => (
          <TableRow key={u.id}>
            <TableCell>{u.email}</TableCell>
            <TableCell>{(u.name || "") + " " + (u.last_name || "")}</TableCell>
            <TableCell>{u.role}</TableCell>
            <TableCell>{statusLabel[u.status] || u.status}</TableCell>

            <TableCell>
              {u.role === "admin" ? (
                <span className="text-default-500">—</span>
              ) : (
                <Select
                  size="sm"
                  items={[
                    { id: "none", name: "Sin institución" },
                    ...institutions.map((i) => ({
                      id: String(i.id),
                      name: i.name,
                    })),
                  ]}
                  selectedKeys={[String(u.institution_id ?? "none")]}
                  onSelectionChange={async (keys) => {
                    const key = String(Array.from(keys)[0]);
                    if (key === "none") return;
                    await onUpdateInstitution(u.id, Number(key));
                  }}
                >
                  {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
                </Select>
              )}
            </TableCell>

            <TableCell>
              <div className="flex gap-2">
                {u.status === "pending" && (
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => onApprove(u)}
                  >
                    Aprobar
                  </Button>
                )}

                {u.status === "active" && (
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => onUpdateStatus(u.id, "inactive")}
                  >
                    Dar de baja
                  </Button>
                )}

                {u.status === "inactive" && (
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => onUpdateStatus(u.id, "active")}
                  >
                    Reactivar
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
