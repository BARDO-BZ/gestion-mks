"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Form, Input, Button, Alert } from "@heroui/react";

export function RestorePassword() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = useMemo(
    () => loading || !token || password.length < 8 || password !== confirm,
    [loading, token, password, confirm]
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al restablecer");
      setOkMsg("¡Contraseña actualizada! Ya podés iniciar sesión.");
      setTimeout(() => router.replace("/"), 1500);
    } catch (err: any) {
      setErrMsg(err.message || "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Alert color="danger" title="Token inválido" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      {okMsg && <Alert color="success" title={okMsg} className="mb-3" />}
      {errMsg && <Alert color="danger" title={errMsg} className="mb-3" />}

      <Form
        onSubmit={onSubmit}
        className="w-full flex flex-col items-stretch mt-8"
      >
        <Input
          isRequired
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onValueChange={setPassword}
          isDisabled={loading}
        />
        <Input
          isRequired
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onValueChange={setConfirm}
          isDisabled={loading}
          errorMessage={
            confirm && confirm !== password ? "No coincide" : undefined
          }
        />
        <Button
          color="primary"
          type="submit"
          isDisabled={disabled}
          isLoading={loading}
        >
          Cambiar contraseña
        </Button>
      </Form>
    </div>
  );
}
