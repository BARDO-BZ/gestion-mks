"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

interface AdminLogRow {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_email: string;
  admin_name: string | null;
  admin_last_name: string | null;
}

const ACTION_LABEL: Record<string, string> = {
  APPROVE_USER: "Aprobó usuario",
  CHANGE_STATUS: "Cambió estado",
  ASSIGN_INSTITUTION: "Asignó institución",
};

function formatDetails(
  action: string,
  details: Record<string, unknown> | null,
): string {
  if (!details) return "—";

  if (action === "CHANGE_STATUS") {
    return `${details.old_status} → ${details.new_status}`;
  }
  if (action === "ASSIGN_INSTITUTION") {
    const oldId = details.old_institution_id ?? "ninguna";
    const newId = details.new_institution_id ?? "ninguna";
    return `Inst. ${oldId} → ${newId}`;
  }
  if (action === "APPROVE_USER" && details.institution_id != null) {
    return `Inst. ${details.institution_id}`;
  }

  return JSON.stringify(details);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminLogsView() {
  const [data, setData] = useState<AdminLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${p}`, {
        credentials: "include",
      });
      const json = await res.json();
      setData(json.data || []);
      setTotal(Number(json.meta?.total || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Actividad de administradores</h1>
        <Button
          size="sm"
          variant="flat"
          isDisabled={loading}
          onPress={() => fetchLogs(page)}
        >
          {loading ? <Spinner size="sm" /> : "Actualizar"}
        </Button>
      </div>

      <Table aria-label="Logs de actividad admin">
        <TableHeader>
          <TableColumn>Acción</TableColumn>
          <TableColumn>Objetivo</TableColumn>
          <TableColumn>Detalle</TableColumn>
          <TableColumn>Admin</TableColumn>
          <TableColumn>Fecha</TableColumn>
        </TableHeader>

        <TableBody
          isLoading={loading}
          loadingContent={<Spinner />}
          emptyContent="No hay registros de actividad"
        >
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {ACTION_LABEL[row.action] ?? row.action}
              </TableCell>
              <TableCell>
                {row.target_type} #{row.target_id}
              </TableCell>
              <TableCell>
                {formatDetails(row.action, row.details)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {[row.admin_name, row.admin_last_name]
                      .filter(Boolean)
                      .join(" ") || row.admin_email}
                  </span>
                  <span className="text-xs text-default-400">
                    {row.admin_email}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatDate(row.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
          />
        </div>
      )}
    </div>
  );
}
