"use client";

import { useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";

type InspectionFrequency = "ANNUAL" | "SEMESTRAL";

interface EppData {
  id: number;
  code: string;
  branch: string;
  service: string;
  epp_type?: string | null;
  details?: string | null;
  fabrication_month: number;
  fabrication_year: number;
  caducidad_years: number;
  inspection_freq: InspectionFrequency;
}

interface EppEditFormProps {
  epp: EppData;
  onUpdated: () => void;
  onClose: () => void;
}

export function EppEditForm({ epp, onUpdated, onClose }: EppEditFormProps) {
  const [code, setCode] = useState(epp.code);
  const [branch, setBranch] = useState(epp.branch);
  const [service, setService] = useState(epp.service);
  const [eppType, setEppType] = useState(epp.epp_type ?? "");
  const [details, setDetails] = useState(epp.details ?? "");
  const [fabricationYear, setFabricationYear] = useState(String(epp.fabrication_year));
  const [fabricationMonth, setFabricationMonth] = useState(String(epp.fabrication_month));
  const [caducidadYears, setCaducidadYears] = useState(String(epp.caducidad_years));
  const [inspectionFreq, setInspectionFreq] = useState<InspectionFrequency>(epp.inspection_freq);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) { setError("El código es requerido"); return; }
    if (!branch.trim()) { setError("La sucursal es requerida"); return; }
    if (!service.trim()) { setError("El servicio es requerido"); return; }
    if (!fabricationYear) { setError("Ingresá el año de fabricación"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/epps/${epp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: code.trim(),
          branch: branch.trim(),
          service: service.trim(),
          epp_type: eppType.trim() || null,
          details: details.trim() || null,
          fabrication_month: Number(fabricationMonth),
          fabrication_year: Number(fabricationYear),
          caducidad_years: Number(caducidadYears),
          inspection_freq: inspectionFreq,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al guardar los cambios");
      }

      onUpdated();
    } catch (err: any) {
      setError(err.message ?? "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Código / Nº de serie"
          isRequired
          value={code}
          onValueChange={setCode}
        />
        <Input
          label="Sucursal"
          isRequired
          value={branch}
          onValueChange={setBranch}
        />
        <Input
          label="Servicio"
          isRequired
          value={service}
          onValueChange={setService}
        />
        <Select
          label="Tipo de EPP"
          selectedKeys={eppType ? new Set([eppType]) : new Set()}
          onSelectionChange={(keys) => setEppType(String(Array.from(keys)[0] ?? ""))}
        >
          {["Delantal", "Conj-Chaleco", "Con-Pollera", "Tiroideo", "Anteojos", "Cortina", "Paciente", "Otro"].map((opt) => (
            <SelectItem key={opt}>{opt}</SelectItem>
          ))}
        </Select>
      </div>

      <Textarea
        label="Detalles"
        placeholder="color, marca, etc."
        value={details}
        onValueChange={setDetails}
        minRows={2}
        maxRows={4}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          label="Mes fabricación"
          selectedKeys={new Set([fabricationMonth])}
          onSelectionChange={(keys) => setFabricationMonth(Array.from(keys)[0] as string)}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <SelectItem key={String(i + 1)}>{String(i + 1)}</SelectItem>
          ))}
        </Select>

        <Input
          label="Año fabricación"
          type="number"
          isRequired
          value={fabricationYear}
          onValueChange={setFabricationYear}
        />

        <Select
          label="Años caducidad"
          selectedKeys={new Set([caducidadYears])}
          onSelectionChange={(keys) => setCaducidadYears(Array.from(keys)[0] as string)}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const y = (i + 3).toString();
            return <SelectItem key={y}>{y}</SelectItem>;
          })}
        </Select>

        <Select
          label="Frec. inspección"
          selectedKeys={new Set([inspectionFreq])}
          onSelectionChange={(keys) => setInspectionFreq(Array.from(keys)[0] as InspectionFrequency)}
        >
          <SelectItem key="ANNUAL">Anual</SelectItem>
          <SelectItem key="SEMESTRAL">Semestral</SelectItem>
        </Select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="light" onPress={onClose}>
          Cancelar
        </Button>
        <Button type="submit" color="primary" isDisabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
