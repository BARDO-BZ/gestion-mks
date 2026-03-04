"use client";

import { Button, Input, Select, SelectItem } from "@heroui/react";
import type { InstitutionOption, UserStatus } from "./AdminUsersView";

export function AdminUsersFilters(props: {
  search: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;

  status: UserStatus | "all";
  onStatusChange: (v: UserStatus | "all") => void;

  institutionId: number | "all" | "null";
  onInstitutionChange: (v: number | "all" | "null") => void;

  institutions: InstitutionOption[];
}) {
  const {
    search,
    onSearchChange,
    onSearchSubmit,
    status,
    onStatusChange,
    institutionId,
    onInstitutionChange,
    institutions,
  } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Buscar por email, nombre o apellido…"
          value={search}
          onValueChange={onSearchChange}
        />
        <Button onPress={onSearchSubmit}>Buscar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Select
          label="Estado"
          selectedKeys={[status]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as any;
            onStatusChange(key);
          }}
        >
          <SelectItem key="all">Todos</SelectItem>
          <SelectItem key="pending">Pendientes</SelectItem>
          <SelectItem key="active">Activos</SelectItem>
          <SelectItem key="inactive">Inactivos</SelectItem>
        </Select>

        <Select
          label="Institución"
          items={[
            { id: "all", name: "Todas" },
            { id: "null", name: "Sin institución" },
            ...institutions.map((i) => ({ id: String(i.id), name: i.name })),
          ]}
          selectedKeys={[String(institutionId)]}
          onSelectionChange={(keys) => {
            const key = String(Array.from(keys)[0]);
            if (key === "all") onInstitutionChange("all");
            else if (key === "null") onInstitutionChange("null");
            else onInstitutionChange(Number(key));
          }}
        >
          {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>
      </div>
    </div>
  );
}
