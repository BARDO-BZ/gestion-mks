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
  status: "APPROVED" | "RESERVED" | "TO_DISCARD" | "DISCARDED" | string;
  fabrication_year: number;
  fabrication_month: number;
  caducidad_year: number;
  caducidad_month: number;
  open_tasks_count?: number;
}

interface EppsTableProps {
  data: Epp[];
  isAdmin: boolean;
}

export function EppsTable({ data, isAdmin }: EppsTableProps) {
  const columns: Array<{ key: string; label: string }> = [
    { key: "code", label: "CODE" },
    ...(isAdmin ? [{ key: "institution", label: "INSTITUCIÓN" }] : []),
    { key: "branch", label: "SUCURSAL" },
    { key: "service", label: "SERVICIO" },
    { key: "status", label: "ESTADO" },
    { key: "fabrication", label: "FABRICACIÓN" },
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
          // ✅ Celdas: también armadas como array (sin null/false)
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
            {
              key: "status",
              node: (
                <div className="flex items-center gap-2">
                  <span>{eppStatusLabel(epp.status)}</span>
                  {(epp.open_tasks_count ?? 0) > 0 && (
                    <Chip size="sm" color="warning" variant="flat">
                      {epp.open_tasks_count} tareas
                    </Chip>
                  )}
                </div>
              ),
            },
            {
              key: "fabrication",
              node: `${epp.fabrication_month}/${epp.fabrication_year}`,
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
