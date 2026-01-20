// src/components/epp/EppForm.tsx
"use client";

import { useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { MONTHS } from "@/data";
type InspectionFrequency = "ANNUAL" | "SEMESTRAL";

interface EppFormProps {
  onCreated: () => void; // para refrescar la tabla
  onClose: () => void; // para cerrar el modal/drawer
}

export function EppForm({ onCreated, onClose }: EppFormProps) {
  const [code, setCode] = useState("");
  const [institution, setInstitution] = useState("");
  const [branch, setBranch] = useState("");
  const [service, setService] = useState("");
  const [fabricationMonth, setFabricationMonth] = useState("1");
  const [fabricationYear, setFabricationYear] = useState("");
  const [caducidadYears, setCaducidadYears] = useState("5");
  const [inspectionFreq, setInspectionFreq] =
    useState<InspectionFrequency>("ANNUAL");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fabricationYear) {
      setError("Ingresá el año de fabricación");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/epps/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          branch,
          service,
          fabrication_month: Number(fabricationMonth),
          fabrication_year: Number(fabricationYear),
          caducidad_years: Number(caducidadYears),
          inspection_freq: inspectionFreq,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al crear el EPP");
      }

      // éxito
      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          label="Mes de fabricación"
          selectedKeys={new Set([fabricationMonth])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setFabricationMonth(value);
          }}
          className="w-full"
        >
          {MONTHS.map((month) => (
            <SelectItem key={month.key}>{month.label}</SelectItem>
          ))}
        </Select>

        <Input
          label="Año de fabricación"
          type="number"
          isRequired
          value={fabricationYear}
          onValueChange={setFabricationYear}
        />

        <Select
          label="Años de caducidad"
          selectedKeys={new Set([caducidadYears])}
          onSelectionChange={(keys) =>
            setCaducidadYears(Array.from(keys)[0] as string)
          }
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const y = (i + 1).toString();
            return <SelectItem key={y}>{y}</SelectItem>;
          })}
        </Select>
      </div>

      <Select
        label="Frecuencia de inspección"
        selectedKeys={new Set([inspectionFreq])}
        onSelectionChange={(keys) =>
          setInspectionFreq(Array.from(keys)[0] as InspectionFrequency)
        }
      >
        <SelectItem key="ANNUAL">Anual</SelectItem>
        <SelectItem key="SEMESTRAL">Semestral</SelectItem>
      </Select>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="light" onPress={onClose}>
          Cancelar
        </Button>
        <Button type="submit" color="primary" isDisabled={saving}>
          {saving ? "Guardando..." : "Guardar EPP"}
        </Button>
      </div>
    </form>
  );
}
