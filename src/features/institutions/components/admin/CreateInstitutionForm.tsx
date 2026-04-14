"use client";

import { useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import type { InstitutionStatus } from "@/features/institutions/api/admin/listInstitutions";

export function CreateInstitutionForm(props: {
  onSubmit: (data: { name: string; account_number: string | null; status: InstitutionStatus }) => void;
  onCancel: () => void;
}) {
  const { onSubmit, onCancel } = props;

  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState<InstitutionStatus>("active");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;

    setSaving(true);
    try {
      await onSubmit({ name: clean, account_number: accountNumber.trim() || null, status });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        label="Nombre"
        placeholder="Ej: Hospital Central"
        value={name}
        onValueChange={setName}
        isRequired
      />

      <Input
        label="Cuenta"
        placeholder="Nº de cliente en sistema externo"
        value={accountNumber}
        onValueChange={setAccountNumber}
        description="Número de al menos 19 dígitos para identificar al cliente"
        type="text"
        inputMode="numeric"
      />

      <Select
        label="Estado"
        selectedKeys={new Set([status])}
        onSelectionChange={(keys) => {
          const key = String(Array.from(keys)[0]) as InstitutionStatus;
          setStatus(key);
        }}
      >
        <SelectItem key="active">Activa</SelectItem>
        <SelectItem key="inactive">Inactiva</SelectItem>
      </Select>

      <div className="flex justify-end gap-2">
        <Button variant="light" onPress={onCancel}>
          Cancelar
        </Button>
        <Button
          color="primary"
          type="submit"
          isDisabled={saving || !name.trim()}
        >
          {saving ? "Creando..." : "Crear"}
        </Button>
      </div>
    </form>
  );
}
