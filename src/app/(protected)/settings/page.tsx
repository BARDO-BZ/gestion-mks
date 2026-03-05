"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Divider, Input, Spinner } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user, loading, refreshUser } = useAuth();

  // — Datos personales —
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // — Contraseña —
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setLastName(user.last_name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const saveProfile = async () => {
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, last_name: lastName, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProfileMsg({ ok: false, text: json.message ?? "Error al guardar" });
      } else {
        await refreshUser();
        setProfileMsg({ ok: true, text: "Datos actualizados correctamente" });
      }
    } catch {
      setProfileMsg({ ok: false, text: "Error de conexión" });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "Las contraseñas no coinciden" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: "La nueva contraseña debe tener al menos 8 caracteres" });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPasswordMsg({ ok: false, text: json.message ?? "Error al cambiar contraseña" });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMsg({ ok: true, text: "Contraseña actualizada correctamente" });
      }
    } catch {
      setPasswordMsg({ ok: false, text: "Error de conexión" });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <Card>
        <CardHeader>
          <p className="font-semibold">Datos personales</p>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Input
              label="Nombre"
              value={name}
              onValueChange={setName}
              variant="bordered"
            />
            <Input
              label="Apellido"
              value={lastName}
              onValueChange={setLastName}
              variant="bordered"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={email}
            onValueChange={setEmail}
            variant="bordered"
          />
          {profileMsg && (
            <p className={`text-sm ${profileMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {profileMsg.text}
            </p>
          )}
          <Button
            color="primary"
            onPress={saveProfile}
            isLoading={profileSaving}
            className="self-end"
          >
            Guardar cambios
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-semibold">Cambiar contraseña</p>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onValueChange={setCurrentPassword}
            variant="bordered"
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onValueChange={setNewPassword}
            variant="bordered"
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            variant="bordered"
          />
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {passwordMsg.text}
            </p>
          )}
          <Button
            color="primary"
            onPress={savePassword}
            isLoading={passwordSaving}
            className="self-end"
          >
            Cambiar contraseña
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
