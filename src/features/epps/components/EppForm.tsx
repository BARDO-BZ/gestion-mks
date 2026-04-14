// src/components/epp/EppForm.tsx
"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Spinner, Textarea } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";

type InspectionFrequency = "ANNUAL" | "SEMESTRAL";

interface InstitutionOption {
  id: number;
  name: string;
}

interface EppFormProps {
  onCreated: () => void;
  onClose: () => void;
}

export function EppForm({ onCreated, onClose }: EppFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  const [code, setCode] = useState("");
  const [institutionId, setInstitutionId] = useState<string>("");
  const [branch, setBranch] = useState("");
  const [service, setService] = useState("");
  const [eppType, setEppType] = useState("");
  const [details, setDetails] = useState("");
  const [fabricationYear, setFabricationYear] = useState("");
  const [caducidadYears, setCaducidadYears] = useState("5");
  const [inspectionFreq, setInspectionFreq] =
    useState<InspectionFrequency>("ANNUAL");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingInstitutions(true);
    fetch("/api/admin/institutions?pageSize=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setInstitutions(j.data || []))
      .catch(() => {})
      .finally(() => setLoadingInstitutions(false));
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fabricationYear) {
      setError("Ingresá el año de fabricación");
      return;
    }

    if (isAdmin && !institutionId) {
      setError("Seleccioná una institución");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        code,
        branch,
        service,
        epp_type: eppType || null,
        details: details || null,
        fabrication_month: 1,
        fabrication_year: Number(fabricationYear),
        caducidad_years: Number(caducidadYears),
        inspection_freq: inspectionFreq,
      };

      if (isAdmin && institutionId) {
        body.institution_id = Number(institutionId);
      }

      const res = await fetch("/api/epps/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al crear el EPP");
      }

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
      {isAdmin && (
        loadingInstitutions ? (
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Spinner size="sm" />
            Cargando instituciones...
          </div>
        ) : (
          <Select
            label="Institución"
            isRequired
            selectedKeys={institutionId ? new Set([institutionId]) : new Set()}
            onSelectionChange={(keys) =>
              setInstitutionId(String(Array.from(keys)[0] ?? ""))
            }
          >
            {institutions.map((inst) => (
              <SelectItem key={String(inst.id)}>{inst.name}</SelectItem>
            ))}
          </Select>
        )
      )}

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
        <Input
          label="Tipo de EPP"
          placeholder="Ej: Arnés, Casco, Guantes..."
          value={eppType}
          onValueChange={setEppType}
        />
      </div>

      <Textarea
        label="Detalles"
        placeholder="color, marca, etc."
        value={details}
        onValueChange={setDetails}
        minRows={2}
        maxRows={4}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          {Array.from({ length: 5 }).map((_, i) => {
            const y = (i + 3).toString(); // 3..7
            return <SelectItem key={y}>{y}</SelectItem>;
          })}
        </Select>

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
      </div>

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
