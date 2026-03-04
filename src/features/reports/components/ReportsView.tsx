"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { eppStatusLabel } from "@/features/epps/utils/eppStatus";
import { useAuth } from "@/contexts/AuthContext";

interface ReportRow {
  code: string;
  institution_name: string;
  branch: string;
  service: string;
  status: string;
  fabrication_month: number;
  fabrication_year: number;
  caducidad_month: number;
  caducidad_year: number;
  inspection_freq: string;
  last_inspection_at: string | null;
  open_tasks: number;
}

interface InstitutionOption { id: number; name: string }

const STATUS_OPTIONS = [
  { key: "", label: "Todos los estados" },
  { key: "TO_DISCARD", label: "A descartar" },
  { key: "RESERVED",   label: "Uso bajo reserva" },
  { key: "APPROVED",   label: "Aprobado" },
  { key: "DISCARDED",  label: "Descartado" },
];

const STATUS_COLORS: Record<string, "danger" | "warning" | "success" | "default"> = {
  TO_DISCARD: "danger",
  RESERVED:   "warning",
  APPROVED:   "success",
  DISCARDED:  "default",
};

export function ReportsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState("");
  const [caducidadFrom, setCaducidadFrom] = useState("");
  const [caducidadTo, setCaducidadTo] = useState("");

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/institutions?pageSize=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setInstitutions(j.data || []))
      .catch(() => {});
  }, [isAdmin]);

  const buildParams = () => {
    const p = new URLSearchParams();
    if (isAdmin && institutionId) p.set("institution_id", institutionId);
    if (status) p.set("status", status);
    if (caducidadFrom) p.set("caducidad_from", caducidadFrom);
    if (caducidadTo) p.set("caducidad_to", caducidadTo);
    return p;
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/reports/epps?${buildParams()}`, { credentials: "include" });
      const json = await res.json();
      setRows(json.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const params = buildParams();
    params.set("format", "csv");
    window.open(`/api/reports/epps?${params}`, "_blank");
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Reportes</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        {isAdmin && (
          <div className="w-56">
            <Select
              label="Institución"
              placeholder="Todas"
              selectedKeys={institutionId ? [institutionId] : []}
              onSelectionChange={(k) => setInstitutionId(String([...k][0] ?? ""))}
              size="sm"
            >
              {institutions.map((i) => (
                <SelectItem key={String(i.id)}>{i.name}</SelectItem>
              ))}
            </Select>
          </div>
        )}

        <div className="w-48">
          <Select
            label="Estado"
            selectedKeys={[status]}
            onSelectionChange={(k) => setStatus(String([...k][0] ?? ""))}
            size="sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Caducidad desde</label>
          <input
            type="month"
            value={caducidadFrom}
            onChange={(e) => setCaducidadFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Caducidad hasta</label>
          <input
            type="month"
            value={caducidadTo}
            onChange={(e) => setCaducidadTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
          />
        </div>

        <Button color="primary" size="sm" onPress={handleSearch} isLoading={loading}>
          Generar reporte
        </Button>

        {rows.length > 0 && (
          <Button variant="flat" size="sm" onPress={handleExportCsv}>
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Resultado */}
      {loading && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {!loading && searched && rows.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Sin resultados para los filtros seleccionados.</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <p className="text-sm text-gray-500">{rows.length} resultado{rows.length !== 1 ? "s" : ""}</p>
          <Table aria-label="Reporte de EPPs" className="mt-1">
            <TableHeader>
              {[
                { key: "code",            label: "Código" },
                ...(isAdmin ? [{ key: "institution", label: "Institución" }] : []),
                { key: "branch",          label: "Sucursal" },
                { key: "service",         label: "Servicio" },
                { key: "status",          label: "Estado" },
                { key: "fabrication",     label: "Fabricación" },
                { key: "caducidad",       label: "Caducidad" },
                { key: "last_inspection", label: "Última inspección" },
                { key: "tasks",           label: "Tareas" },
              ].map((col) => (
                <TableColumn key={col.key}>{col.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const cells = [
                  { key: "code",            node: r.code },
                  ...(isAdmin ? [{ key: "institution", node: r.institution_name ?? "—" }] : []),
                  { key: "branch",          node: r.branch },
                  { key: "service",         node: r.service },
                  { key: "status",          node: (
                    <Chip size="sm" color={STATUS_COLORS[r.status] ?? "default"} variant="flat">
                      {eppStatusLabel(r.status)}
                    </Chip>
                  )},
                  { key: "fabrication",     node: `${r.fabrication_month}/${r.fabrication_year}` },
                  { key: "caducidad",       node: `${r.caducidad_month}/${r.caducidad_year}` },
                  { key: "last_inspection", node: r.last_inspection_at
                      ? new Date(r.last_inspection_at).toLocaleDateString("es-AR")
                      : "—" },
                  { key: "tasks",           node: Number(r.open_tasks) > 0
                      ? <Chip size="sm" color="warning" variant="flat">{r.open_tasks}</Chip>
                      : "—" },
                ];
                return (
                  <TableRow key={i}>
                    {cells.map((c) => <TableCell key={c.key}>{c.node}</TableCell>)}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
