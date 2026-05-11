"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import type { InstitutionOption } from "./AdminUsersView";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: InstitutionOption[];
  onCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, institutions, onCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"client" | "admin">("client");
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState<"active" | "pending">("active");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setLastName("");
    setRole("client");
    setInstitutionId("");
    setStatus("active");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === "client" && !institutionId) {
      setError("Seleccioná una institución para el usuario client");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          last_name: lastName,
          role,
          institution_id: institutionId ? Number(institutionId) : null,
          status,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Error al crear el usuario");
        return;
      }

      onCreated();
      handleClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Nuevo usuario</ModalHeader>
            <ModalBody className="pb-6">
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nombre"
                    isRequired
                    value={name}
                    onValueChange={setName}
                  />
                  <Input
                    label="Apellido"
                    isRequired
                    value={lastName}
                    onValueChange={setLastName}
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  isRequired
                  value={email}
                  onValueChange={setEmail}
                />

                <Input
                  label="Contraseña"
                  type="password"
                  isRequired
                  description="Mínimo 8 caracteres"
                  value={password}
                  onValueChange={setPassword}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Rol"
                    selectedKeys={new Set([role])}
                    onSelectionChange={(keys) =>
                      setRole(String(Array.from(keys)[0] ?? "client") as "client" | "admin")
                    }
                  >
                    <SelectItem key="client">Client</SelectItem>
                    <SelectItem key="admin">Admin</SelectItem>
                  </Select>

                  <Select
                    label="Estado inicial"
                    selectedKeys={new Set([status])}
                    onSelectionChange={(keys) =>
                      setStatus(String(Array.from(keys)[0] ?? "active") as "active" | "pending")
                    }
                  >
                    <SelectItem key="active">Activo</SelectItem>
                    <SelectItem key="pending">Pendiente</SelectItem>
                  </Select>
                </div>

                {role === "client" && (
                  <Select
                    label="Institución"
                    isRequired
                    placeholder="Seleccioná una institución"
                    selectedKeys={institutionId ? new Set([institutionId]) : new Set()}
                    onSelectionChange={(keys) =>
                      setInstitutionId(String(Array.from(keys)[0] ?? ""))
                    }
                  >
                    {institutions.map((inst) => (
                      <SelectItem key={String(inst.id)}>{inst.name}</SelectItem>
                    ))}
                  </Select>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="light" onPress={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" color="primary" isLoading={saving}>
                    Crear usuario
                  </Button>
                </div>
              </form>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
