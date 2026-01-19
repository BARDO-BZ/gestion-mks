"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
} from "@heroui/react";
import { AdminUsersFilters } from "./AdminUsersFilters";
import { AdminUsersTable } from "./AdminUsersTable";
import { ApproveUserModal } from "./ApproveUserModal";

export type UserStatus = "pending" | "active" | "inactive";
export type UserRole = "admin" | "client";

export interface InstitutionOption {
  id: number;
  name: string;
}

export interface AdminUserRow {
  id: number;
  email: string;
  name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
  institution_id: number | null;
  institution_name?: string | null;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function AdminUsersView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("pending");
  const [institutionId, setInstitutionId] = useState<number | "all">("all");

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  const fetchInstitutions = async () => {
    const res = await fetch("/api/admin/institutions", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("No se pudieron cargar instituciones");
    const json = await res.json();
    setInstitutions(json.data || []);
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (institutionId !== "all")
      params.set("institutionId", String(institutionId));

    const res = await fetch(`/api/admin/users?${params.toString()}`, {
      credentials: "include",
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || "Error al listar usuarios");
    }

    const json = await res.json();
    setUsers(json.data || []);
    setTotal(Number(json.pagination?.total || 0));
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchInstitutions(), fetchUsers()]);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // cada vez que cambian filtros/paginado
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchUsers();
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, institutionId]);

  const onApproveClick = (u: AdminUserRow) => {
    setSelectedUser(u);
    setApproveOpen(true);
  };

  const approveUser = async (userId: number, instId: number) => {
    const res = await fetch(`/api/admin/users/${userId}/approve`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institution_id: instId }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || "No se pudo aprobar el usuario");
    }
    await fetchUsers();
  };

  const updateStatus = async (userId: number, newStatus: UserStatus) => {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || "No se pudo actualizar el estado");
    }
    await fetchUsers();
  };

  const updateInstitution = async (userId: number, instId: number) => {
    const res = await fetch(`/api/admin/users/${userId}/institution`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institution_id: instId }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || "No se pudo actualizar la institución");
    }
    await fetchUsers();
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Spinner label="Cargando usuarios..." />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Usuarios</h1>
            <p className="text-sm text-default-500">
              Aprobá registros pendientes, asigná instituciones y gestioná
              estados.
            </p>
          </div>

          <Button variant="light" onPress={refresh}>
            Refrescar
          </Button>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-4">
          {error && <div className="text-sm text-red-500">{error}</div>}

          <AdminUsersFilters
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={() => {
              setPage(1);
              fetchUsers();
            }}
            status={status}
            onStatusChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
            institutionId={institutionId}
            onInstitutionChange={(v) => {
              setPage(1);
              setInstitutionId(v);
            }}
            institutions={institutions}
          />

          <AdminUsersTable
            users={users}
            institutions={institutions}
            onApprove={onApproveClick}
            onUpdateStatus={updateStatus}
            onUpdateInstitution={updateInstitution}
          />

          <div className="flex items-center justify-between text-sm text-default-500">
            <span>
              Página {page} / {totalPages} — Total: {total}
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="bordered"
                isDisabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="bordered"
                isDisabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <ApproveUserModal
        isOpen={approveOpen}
        onClose={() => {
          setApproveOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        institutions={institutions}
        onApprove={approveUser}
      />
    </div>
  );
}
