import React, { useState } from "react";
import { Form, Input, Button } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";

export function Register() {
  const { register, loading } = useAuth();
  const [userInfo, setUserInfo] = useState({
    email: "",
    name: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar nombre
    if (!userInfo.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    // Validar apellido
    if (!userInfo.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userInfo.email) {
      newErrors.email = "El email es requerido";
    } else if (!emailRegex.test(userInfo.email)) {
      newErrors.email = "El formato del email no es válido";
    }

    // Validar contraseña
    if (!userInfo.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (userInfo.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    // Validar confirmación de contraseña
    if (!userInfo.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (userInfo.password !== userInfo.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Limpiar errores previos

    try {
      await register({
        email: userInfo.email,
        name: userInfo.name,
        lastName: userInfo.lastName,
        password: userInfo.password,
      });

      // Si el registro es exitoso, mostrar mensaje de éxito
      setRegistrationSuccess(true);
    } catch (error: any) {
      console.error("Error en registro:", error);
      setErrors({
        submit: error.message || "Error al registrar usuario",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (field: keyof typeof userInfo) => (value: string) => {
      setUserInfo({ ...userInfo, [field]: value });

      // Limpiar error del campo al empezar a escribir
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
      }
    };

  // Si el registro fue exitoso, mostrar mensaje de validación
  if (registrationSuccess) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-green-800 mb-3">
            ¡Registro exitoso!
          </h2>

          <p className="text-green-700 mb-4">
            Hemos enviado un correo de verificación a{" "}
            <span className="font-medium">{userInfo.email}</span>
          </p>

          <p className="text-green-600 text-sm mb-6">
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace de
            verificación para activar tu cuenta.
          </p>

          <div className="space-y-3">
            <Button as="a" href="/" color="primary" className="w-full">
              Ir al inicio de sesión
            </Button>

            <p className="text-xs text-gray-500">
              ¿No recibiste el correo? Revisa tu carpeta de spam o{" "}
              <button
                className="text-primary hover:underline"
                onClick={() => {
                  // Aquí podrías agregar lógica para reenviar el email
                  console.log("Reenviar email de verificación");
                }}
              >
                solicita uno nuevo
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form
      className="w-full flex flex-col items-stretch mt-8"
      onSubmit={onSubmit}
    >
      <p className="text-xs text-gray-600 mb-6">
        Introduce tu información para crear tu cuenta. Una vez registrado,
        podrás acceder a todas las funcionalidades de la plataforma.
      </p>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {errors.submit}
        </div>
      )}

      <div className="w-full flex justify-between gap-4 mb-4">
        <Input
          className="w-[48%]"
          isRequired
          name="name"
          type="text"
          label="Nombre"
          placeholder="Ingresa tu nombre"
          value={userInfo.name}
          onValueChange={handleInputChange("name")}
          isInvalid={!!errors.name}
          errorMessage={errors.name}
        />
        <Input
          className="w-[48%]"
          isRequired
          name="lastName"
          type="text"
          label="Apellido"
          placeholder="Ingresa tu apellido"
          value={userInfo.lastName}
          onValueChange={handleInputChange("lastName")}
          isInvalid={!!errors.lastName}
          errorMessage={errors.lastName}
        />
      </div>

      <Input
        isRequired
        name="email"
        type="email"
        label="Email"
        placeholder="ejemplo@correo.com"
        value={userInfo.email}
        onValueChange={handleInputChange("email")}
        isInvalid={!!errors.email}
        errorMessage={errors.email}
        className="mb-4"
      />

      <Input
        isRequired
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        value={userInfo.password}
        onValueChange={handleInputChange("password")}
        isInvalid={!!errors.password}
        errorMessage={errors.password}
        className="mb-4"
      />

      <Input
        isRequired
        name="confirmPassword"
        type="password"
        label="Confirmar Contraseña"
        placeholder="Repite tu contraseña"
        value={userInfo.confirmPassword}
        onValueChange={handleInputChange("confirmPassword")}
        isInvalid={!!errors.confirmPassword}
        errorMessage={errors.confirmPassword}
        className="mb-6"
      />

      <Button
        className="mt-4"
        type="submit"
        color="primary"
        isLoading={isSubmitting || loading}
        disabled={isSubmitting || loading}
      >
        {isSubmitting ? "Registrando..." : "Registrarse"}
      </Button>

      <p className="text-center text-sm text-gray-600 mt-4 mb-12">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="text-primary hover:underline font-medium">
          Inicia sesión
        </a>
      </p>
    </Form>
  );
}
