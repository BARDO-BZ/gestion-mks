"use client";
import React, { useState } from "react";
import { Form, Input, Button, Alert } from "@heroui/react";

export function ResetPassword() {
  const [email, setEmail] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error solicitando reseteo");
      setOkMsg(data.message || "Si el email existe, vas a recibir un enlace.");
    } catch (err: any) {
      setErrMsg(err.message || "Error solicitando reseteo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      className="w-full flex flex-col items-stretch mt-8"
      onSubmit={onSubmit}
    >
      {okMsg && <Alert color="success" title={okMsg} className="mb-3" />}
      {errMsg && <Alert color="danger" title={errMsg} className="mb-3" />}

      <p className="text-xs">
        Introduce tu dirección de correo electrónico. Una vez que recibas el
        correo electrónico para restablecer tu contraseña, haz clic en el enlace
        adjunto para restablecer tu contraseña e iniciar sesión.
      </p>

      <Input
        isRequired
        errorMessage="Por favor ingresá un email válido"
        name="email"
        type="email"
        placeholder="Email"
        className="mt-6"
        value={email}
        onValueChange={setEmail}
        isDisabled={loading}
      />

      <Button
        className="mt-4"
        type="submit"
        color="primary"
        isDisabled={loading}
        isLoading={loading}
      >
        Recuperar contraseña
      </Button>
    </Form>
  );
}
