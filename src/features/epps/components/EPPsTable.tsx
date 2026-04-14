"use client";

import Link from "next/link";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { eppStatusLabel } from "../utils/eppStatus";

export interface Epp {
  id: number;
  code: string;
  institution_id: number;
  institution?: string | null;
  institution_name?: string | null;
  branch: string;
  service: string;
  epp_type?: string | null;
  status: "APPROVED" | "RESERVED" | "TO_DISCARD" | "DISCARDED" | string;
  fabrication_year: number;
  fabrication_month: number;
  caducidad_year: number;
  caducidad_month: number;
  open_tasks_count?: number;
  inspection_overdue?: boolean | number;
}

interface EppsTableProps {
  data: Epp[];
  isAdmin: boolean;
}

export function EppsTable({ data, isAdmin }: EppsTableProps) {
  const columns: Array<{ key: string; label: string }> = [
    { key: "code", label: "CÓDIGO" },
    ...(isAdmin ? [{ key: "institution", label: "INSTITUCIÓN" }] : []),
    { key: "branch", label: "SUCURSAL" },
    { key: "service", label: "SERVICIO" },
    { key: "epp_type", label: "TIPO EPP" },
    { key: "status", label: "ESTADO" },
    { key: "caducidad", label: "CADUCIDAD" },
  ];

  return (
    <Table aria-label="Listado de EPP">
      <TableHeader>
        {columns.map((c) => (
          <TableColumn key={c.key}>{c.label}</TableColumn>
        ))}
      </TableHeader>

      <TableBody emptyContent="No hay EPP cargados">
        {data.map((epp) => {
          const hasOpenTasks = (epp.open_tasks_count ?? 0) > 0;
          const inspOverdue = Boolean(epp.inspection_overdue);

          const cells: Array<{ key: string; node: React.ReactNode }> = [
            {
              key: "code",
              node: (
                <Link
                  href={`/epp/${epp.id}`}
                  className="underline text-primary"
                >
                  {epp.code}
                </Link>
              ),
            },
            ...(isAdmin
              ? [
                  {
                    key: "institution",
                    node: epp.institution_name ?? epp.institution ?? "—",
                  },
                ]
              : []),
            { key: "branch", node: epp.branch },
            { key: "service", node: epp.service },
            { key: "epp_type", node: epp.epp_type ?? "—" },
            {
              key: "status",
              node: (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="shrink-0">{eppStatusLabel(epp.status)}</span>
                  {hasOpenTasks && (
                    <Chip size="sm" color="warning" variant="flat">
                      {epp.open_tasks_count} tarea{(epp.open_tasks_count ?? 0) !== 1 ? "s" : ""}
                    </Chip>
                  )}
                  {inspOverdue && (
                    <Chip size="sm" color="danger" variant="flat">
                      Insp. vencida
                    </Chip>
                  )}
                </div>
              ),
            },
            {
              key: "caducidad",
              node: `${epp.caducidad_month}/${epp.caducidad_year}`,
            },
          ];

          return (
            <TableRow key={epp.id}>
              {cells.map((c) => (
                <TableCell key={c.key}>{c.node}</TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
