"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Switch,
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

const EXPIRING_OPTIONS = [
  { key: "", label: "Cualquier fecha" },
  { key: "1", label: "Próximo mes" },
  { key: "3", label: "Próximos 3 meses" },
  { key: "6", label: "Próximos 6 meses" },
];

const STATUS_COLORS: Record<string, "danger" | "warning" | "success" | "default"> = {
  TO_DISCARD: "danger",
  RESERVED:   "warning",
  APPROVED:   "success",
  DISCARDED:  "default",
};

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl p-4 gap-1 shadow-sm min-w-[100px]">
      <span className="text-3xl font-bold" style={color ? { color } : undefined}>{value}</span>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

export function ReportsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Opciones de filtros
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [branches, setBranches] = useState<string[]>([]);

  // Valores de filtros
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState("");
  const [branch, setBranch] = useState("");
  const [caducidadFrom, setCaducidadFrom] = useState("");
  const [caducidadTo, setCaducidadTo] = useState("");
  const [expiringMonths, setExpiringMonths] = useState("");
  const [pendingInspection, setPendingInspection] = useState(false);

  // Resultado
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Cargar instituciones (admin)
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/institutions?pageSize=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setInstitutions(j.data || []))
      .catch(() => {});
  }, [isAdmin]);

  // Cargar sucursales cuando cambia institución
  useEffect(() => {
    setBranch("");
    const params = new URLSearchParams();
    if (isAdmin && institutionId) params.set("institution_id", institutionId);
    fetch(`/api/reports/branches?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setBranches(j.data || []))
      .catch(() => {});
  }, [isAdmin, institutionId]);

  const buildParams = () => {
    const p = new URLSearchParams();
    if (isAdmin && institutionId) p.set("institution_id", institutionId);
    if (status) p.set("status", status);
    if (branch) p.set("branch", branch);
    if (expiringMonths) {
      p.set("expiring_months", expiringMonths);
    } else {
      if (caducidadFrom) p.set("caducidad_from", caducidadFrom);
      if (caducidadTo) p.set("caducidad_to", caducidadTo);
    }
    if (pendingInspection) p.set("pending_inspection", "1");
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

  const handleExportExcel = () => {
    if (rows.length === 0) return;

    const sheetData = rows.map((r) => ({
      "Código": r.code,
      "Institución": r.institution_name ?? "—",
      "Sucursal": r.branch ?? "—",
      "Servicio": r.service ?? "—",
      "Estado": eppStatusLabel(r.status),
      "Fabricación": `${r.fabrication_month}/${r.fabrication_year}`,
      "Caducidad": `${r.caducidad_month}/${r.caducidad_year}`,
      "Frec. Inspección": r.inspection_freq === "SEMESTRAL" ? "Semestral" : "Anual",
      "Última inspección": r.last_inspection_at
        ? new Date(r.last_inspection_at).toLocaleDateString("es-AR")
        : "—",
      "Tareas abiertas": Number(r.open_tasks),
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EPPs");
    XLSX.writeFile(wb, `reporte-epps-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Stats del resultado
  const statusCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const withOpenTasks = rows.filter((r) => Number(r.open_tasks) > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Reportes</h1>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <p className="font-semibold text-sm">Filtros</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-end">
            {isAdmin && (
              <div className="w-56">
                <Select
                  label="Institución"
                  placeholder="Todas"
                  selectedKeys={institutionId ? [institutionId] : []}
                  onSelectionChange={(k) => setInstitutionId(String([...k][0] ?? ""))}
                  size="sm"
                  variant="bordered"
                >
                  {institutions.map((i) => (
                    <SelectItem key={String(i.id)}>{i.name}</SelectItem>
                  ))}
                </Select>
              </div>
            )}

            <div className="w-48">
              <Select
                label="Sucursal"
                placeholder={branches.length === 0 ? "Sin sucursales" : "Todas"}
                selectedKeys={branch ? [branch] : []}
                onSelectionChange={(k) => setBranch(String([...k][0] ?? ""))}
                size="sm"
                variant="bordered"
                isDisabled={branches.length === 0}
              >
                {branches.map((b) => (
                  <SelectItem key={b}>{b}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="w-48">
              <Select
                label="Estado"
                selectedKeys={[status]}
                onSelectionChange={(k) => setStatus(String([...k][0] ?? ""))}
                size="sm"
                variant="bordered"
              >
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.key}>{o.label}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="w-52">
              <Select
                label="Próximos vencimientos"
                selectedKeys={[expiringMonths]}
                onSelectionChange={(k) => {
                  setExpiringMonths(String([...k][0] ?? ""));
                  if ([...k][0]) {
                    setCaducidadFrom("");
                    setCaducidadTo("");
                  }
                }}
                size="sm"
                variant="bordered"
              >
                {EXPIRING_OPTIONS.map((o) => (
                  <SelectItem key={o.key}>{o.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Segunda fila: caducidad manual + switch */}
          <div className="flex flex-wrap gap-3 items-end">
            {!expiringMonths && (
              <>
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
              </>
            )}

            <div className="flex items-center gap-2 pb-1">
              <Switch
                isSelected={pendingInspection}
                onValueChange={setPendingInspection}
                size="sm"
              >
                <span className="text-sm">Solo inspecciones pendientes</span>
              </Switch>
            </div>

            <Button color="primary" size="sm" onPress={handleSearch} isLoading={loading} className="ml-auto">
              Generar reporte
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Cargando */}
      {loading && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {/* Sin resultados */}
      {!loading && searched && rows.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Sin resultados para los filtros seleccionados.</p>
      )}

      {/* Resultados */}
      {!loading && rows.length > 0 && (
        <>
          {/* Stats cards */}
          <div className="flex flex-wrap gap-3">
            <SummaryCard label="Total EPPs" value={rows.length} />
            {Object.entries(statusCounts)
              .sort(([a], [b]) => {
                const order = ["TO_DISCARD", "RESERVED", "APPROVED", "DISCARDED"];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([st, count]) => (
                <div
                  key={st}
                  className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl p-4 gap-1 shadow-sm min-w-[100px]"
                >
                  <span className="text-3xl font-bold">{count}</span>
                  <Chip size="sm" color={STATUS_COLORS[st] ?? "default"} variant="flat">
                    {eppStatusLabel(st)}
                  </Chip>
                </div>
              ))}
            {withOpenTasks > 0 && (
              <SummaryCard label="Con tareas abiertas" value={withOpenTasks} color="#f59e0b" />
            )}
          </div>

          {/* Tabla + botón export */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{rows.length} resultado{rows.length !== 1 ? "s" : ""}</p>
            <Button variant="flat" size="sm" onPress={handleExportExcel}>
              Exportar Excel
            </Button>
          </div>

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
                  { key: "branch",          node: r.branch ?? "—" },
                  { key: "service",         node: r.service ?? "—" },
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
