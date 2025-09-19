"use client";

import React, { useState } from "react";
import { Form, Input, Button, Checkbox, Alert } from "@heroui/react";
import { EyeSlashFilledIcon, EyeFilledIcon } from "@/components/Icon";
import { useAuth } from "@/contexts/AuthContext";

export function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (e: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(userInfo.email, userInfo.password, rememberMe);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      className="w-full flex flex-col items-stretch mt-8"
      onSubmit={onSubmit}
    >
      {error && (
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col w-full">
            <div className="w-full flex items-center my-3">
              <Alert color="danger" title={error} />
            </div>
          </div>
        </div>
      )}

      <Input
        isRequired
        errorMessage="Por favor ingresá un email válido"
        name="email"
        type="email"
        placeholder="Email"
        value={userInfo.email}
        onValueChange={(e) => setUserInfo({ ...userInfo, email: e })}
        isDisabled={loading}
      />

      <Input
        required
        name="password"
        value={userInfo.password}
        endContent={
          <button
            aria-label="toggle password visibility"
            className="focus:outline-solid outline-transparent"
            type="button"
            onClick={toggleVisibility}
            disabled={loading}
          >
            {isVisible ? (
              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
          </button>
        }
        type={isVisible ? "text" : "password"}
        placeholder="Contraseña"
        onValueChange={(e) => setUserInfo({ ...userInfo, password: e })}
        isDisabled={loading}
      />

      <Checkbox
        isSelected={rememberMe}
        onValueChange={setRememberMe}
        size="sm"
        className="mt-4"
        isDisabled={loading}
      >
        <p className="text-xs">Mantener sesión iniciada</p>
      </Checkbox>

      <Button
        type="submit"
        color="primary"
        isLoading={loading}
        isDisabled={loading}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </Button>
    </Form>
  );
}
