"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
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
import { useAuth } from "@/contexts/AuthContext";

interface ParsedRow {
  code: string;
  branch: string;
  service: string;
  epp_type: string;
  fabrication_year: number;
}

interface ImportResult {
  inserted: number;
  skipped: Array<{ row: number; code: string; reason: string }>;
  errors: Array<{ row: number; code?: string; reason: string }>;
}

interface InstitutionOption {
  id: number;
  name: string;
}

interface EppImportModalProps {
  onImported: () => void;
  onClose: () => void;
}

// Normaliza el texto de un encabezado para comparación flexible
function normalizeHeader(h: string): string {
  return h.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function findCol(headers: string[], ...candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.findIndex((h) => h.includes(normalizeHeader(c)));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseMKSExcel(workbook: XLSX.WorkBook): ParsedRow[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Convertir a array de arrays (raw, sin encabezados automáticos)
  const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (matrix.length < 2) return [];

  // Buscar fila de encabezados: la primera fila que tenga "#ID" o "CODIGO" o similar
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    const row = matrix[i].map((c) => String(c ?? ""));
    const norm = row.map(normalizeHeader);
    if (norm.some((h) => h.includes("ID") || h.includes("CODIGO") || h.includes("CDIGO"))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx < 0) headerRowIdx = 0; // fallback: primera fila

  const rawHeaders = matrix[headerRowIdx].map((c) => String(c ?? ""));

  const idxCode    = findCol(rawHeaders, "#ID", "ID", "CODIGO", "CÓDIGO", "SERIE");
  const idxBranch  = findCol(rawHeaders, "SUCURSAL", "BRANCH");
  const idxService = findCol(rawHeaders, "SERVICIO", "SERVICE");
  const idxType    = findCol(rawHeaders, "TIPO EPP", "TIPO", "EPP TYPE", "EPPTYPE");
  const idxYear    = findCol(rawHeaders, "ALTA", "AÑO", "ANO", "FAB", "FABRICACION", "FABRICACIÓN", "YEAR");

  const rows: ParsedRow[] = [];

  for (let i = headerRowIdx + 1; i < matrix.length; i++) {
    const cols = matrix[i].map((c) => String(c ?? "").trim());

    const code    = idxCode    >= 0 ? cols[idxCode]    : "";
    const branch  = idxBranch  >= 0 ? cols[idxBranch]  : "";
    const service = idxService >= 0 ? cols[idxService] : "";
    const epp_type = idxType   >= 0 ? cols[idxType]    : "";
    const yearRaw = idxYear    >= 0 ? cols[idxYear]    : "";
    const fabrication_year = parseInt(yearRaw, 10);

    if (!code) continue;

    rows.push({ code, branch, service, epp_type, fabrication_year });
  }

  return rows;
}

export function EppImportModal({ onImported, onClose }: EppImportModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [loadingInst, setLoadingInst] = useState(false);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingInst(true);
    fetch("/api/admin/institutions?pageSize=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setInstitutions(j.data || []))
      .catch(() => {})
      .finally(() => setLoadingInst(false));
  }, [isAdmin]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const parsed = parseMKSExcel(workbook);
        if (parsed.length === 0) {
          setParseError("No se encontraron filas válidas en el archivo. Verificá que el formato sea correcto.");
        } else {
          setRows(parsed);
        }
      } catch {
        setParseError("Error al leer el archivo. Asegurate de subir un archivo Excel válido (.xlsx o .xls).");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (isAdmin && !institutionId) {
      setParseError("Seleccioná una institución.");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/epps/import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution_id: isAdmin ? Number(institutionId) : undefined,
          rows,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setParseError(json.message ?? "Error al importar.");
        return;
      }

      setResult(json as ImportResult);
      if (json.inserted > 0) onImported();
    } catch {
      setParseError("Error de conexión.");
    } finally {
      setImporting(false);
    }
  };

  const canImport = rows.length > 0 && (!isAdmin || !!institutionId) && !importing;

  return (
    <div className="flex flex-col gap-4">
      {/* Formato esperado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-blue-800 mb-1">Formato del archivo Excel</p>
        <p className="text-blue-700 text-xs mb-2">
          El archivo debe tener una fila de encabezados con las siguientes columnas (en cualquier orden):
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-blue-700">
          <span><span className="font-mono font-semibold">#ID</span> — Código / Nº de serie (obligatorio)</span>
          <span><span className="font-mono font-semibold">SUCURSAL</span> — Sucursal</span>
          <span><span className="font-mono font-semibold">SERVICIO</span> — Servicio</span>
          <span><span className="font-mono font-semibold">TIPO EPP</span> — Tipo de EPP</span>
          <span><span className="font-mono font-semibold">ALTA</span> — Año de fabricación</span>
        </div>
        <p className="text-blue-600 text-xs mt-2">
          Formatos soportados: <strong>.xlsx</strong> y <strong>.xls</strong>
        </p>
      </div>

      {/* Institution selector (admin only) */}
      {isAdmin && (
        <div>
          {loadingInst ? (
            <Spinner size="sm" />
          ) : (
            <Select
              label="Institución"
              placeholder="Seleccioná una institución"
              selectedKeys={institutionId ? [institutionId] : []}
              onSelectionChange={(keys) =>
                setInstitutionId(String([...keys][0] ?? ""))
              }
            >
              {institutions.map((inst) => (
                <SelectItem key={String(inst.id)}>
                  {inst.name}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* File input */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Archivo Excel</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="mt-1 text-sm"
        />
      </div>

      {parseError && (
        <p className="text-sm text-red-500">{parseError}</p>
      )}

      {/* Preview table */}
      {rows.length > 0 && !result && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            Vista previa — {rows.length} fila{rows.length !== 1 ? "s" : ""} detectada{rows.length !== 1 ? "s" : ""}
          </p>
          <div className="max-h-64 overflow-auto border rounded-lg">
            <Table
              aria-label="Preview"
              removeWrapper
              classNames={{ th: "bg-gray-50 text-xs", td: "text-xs py-1" }}
            >
              <TableHeader>
                <TableColumn>Código</TableColumn>
                <TableColumn>Sucursal</TableColumn>
                <TableColumn>Servicio</TableColumn>
                <TableColumn>Tipo EPP</TableColumn>
                <TableColumn>Año alta</TableColumn>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 100).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.branch || "—"}</TableCell>
                    <TableCell>{r.service || "—"}</TableCell>
                    <TableCell>{r.epp_type || "—"}</TableCell>
                    <TableCell>{r.fabrication_year || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 100 && (
            <p className="text-xs text-gray-400">
              Mostrando 100 de {rows.length} filas.
            </p>
          )}
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-green-600">
            ✓ {result.inserted} EPP{result.inserted !== 1 ? "s" : ""} importado{result.inserted !== 1 ? "s" : ""} correctamente.
          </p>

          {result.skipped.length > 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-600">
                {result.skipped.length} omitido{result.skipped.length !== 1 ? "s" : ""}:
              </p>
              <ul className="text-xs text-yellow-700 list-disc ml-4 max-h-32 overflow-auto">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    Fila {s.row} ({s.code}): {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600">
                {result.errors.length} error{result.errors.length !== 1 ? "es" : ""}:
              </p>
              <ul className="text-xs text-red-700 list-disc ml-4 max-h-32 overflow-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Fila {e.row}{e.code ? ` (${e.code})` : ""}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="flat" onPress={onClose}>
          {result ? "Cerrar" : "Cancelar"}
        </Button>
        {!result && (
          <Button
            color="primary"
            isDisabled={!canImport}
            isLoading={importing}
            onPress={handleImport}
          >
            Importar {rows.length > 0 ? `(${rows.length})` : ""}
          </Button>
        )}
      </div>
    </div>
  );
}
