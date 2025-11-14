"use client";

import Link from "next/link";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

export interface Epp {
  id: number;
  code: string;
  institution: string;
  branch: string;
  service: string;
  status: string;
  fabrication_year: number;
  fabrication_month: number;
  caducidad_year: number;
  caducidad_month: number;
}

interface EppsTableProps {
  data: Epp[];
}

export function EppsTable({ data }: EppsTableProps) {
  return (
    <Table aria-label="Listado de EPP">
      <TableHeader>
        <TableColumn>CODE</TableColumn>
        <TableColumn>INSTITUCIÓN</TableColumn>
        <TableColumn>SUCURSAL</TableColumn>
        <TableColumn>SERVICIO</TableColumn>
        <TableColumn>ESTADO</TableColumn>
        <TableColumn>FABRICACIÓN</TableColumn>
        <TableColumn>CADUCIDAD</TableColumn>
      </TableHeader>

      {/* IMPORTANTE: solo TableRow/TableCell dentro del TableBody */}
      <TableBody emptyContent="No hay EPP cargados">
        {data.map((epp) => (
          <TableRow key={epp.id}>
            <TableCell>
              {/* Link SOLO dentro de la celda, no envolviendo la fila */}
              <Link href={`/epp/${epp.id}`} className="underline text-primary">
                {epp.code}
              </Link>
            </TableCell>
            <TableCell>{epp.institution}</TableCell>
            <TableCell>{epp.branch}</TableCell>
            <TableCell>{epp.service}</TableCell>
            <TableCell>{epp.status}</TableCell>
            <TableCell>
              {epp.fabrication_month}/{epp.fabrication_year}
            </TableCell>
            <TableCell>
              {epp.caducidad_month}/{epp.caducidad_year}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
