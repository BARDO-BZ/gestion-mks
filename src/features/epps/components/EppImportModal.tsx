"use client";

import { useEffect, useRef, useState } from "react";
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

// CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse the MKS CSV format:
// Row 0: Section headers (DATOS EPP, DATOS EVALUACIÓN, ...)
// Row 1: Column names (#ID, TIPO EPP, SERVICIO, ALTA (año), ...)
// Row 2+: Data
function parseMKSCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length < 3) return [];

  // Row 1 (index 1) has the column headers
  const headers = parseCSVLine(lines[1]).map((h) => h.trim().toUpperCase());

  const idxCode = headers.findIndex((h) => h === "#ID");
  const idxBranch = headers.findIndex((h) => h === "TIPO EPP");
  const idxService = headers.findIndex((h) => h.startsWith("SERVICIO"));
  const idxYear = headers.findIndex((h) => h.startsWith("ALTA"));

  const rows: ParsedRow[] = [];

  for (let i = 2; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);

    const code = idxCode >= 0 ? (cols[idxCode] ?? "").trim() : "";
    const branch = idxBranch >= 0 ? (cols[idxBranch] ?? "").trim() : "";
    const service = idxService >= 0 ? (cols[idxService] ?? "").trim() : "";
    const yearRaw = idxYear >= 0 ? (cols[idxYear] ?? "").trim() : "";
    const fabrication_year = parseInt(yearRaw, 10);

    if (!code) continue; // skip empty rows

    rows.push({ code, branch, service, fabrication_year });
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
      const text = ev.target?.result as string;
      try {
        const parsed = parseMKSCsv(text);
        if (parsed.length === 0) {
          setParseError("No se encontraron filas válidas en el archivo.");
        } else {
          setRows(parsed);
        }
      } catch {
        setParseError("Error al leer el archivo CSV.");
      }
    };
    reader.readAsText(file, "UTF-8");
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
        <p className="text-sm font-medium">Archivo CSV</p>
        <p className="text-xs text-gray-500">
          Usá el formato de la planilla MKS (con encabezados en fila 2).
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
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
                <TableColumn>Tipo EPP</TableColumn>
                <TableColumn>Servicio</TableColumn>
                <TableColumn>Año alta</TableColumn>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 100).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.branch}</TableCell>
                    <TableCell>{r.service}</TableCell>
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
