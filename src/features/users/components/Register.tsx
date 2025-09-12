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

    try {
      await register({
        email: userInfo.email,
        name: userInfo.name,
        lastName: userInfo.lastName,
        password: userInfo.password,
      });
    } catch (error: any) {
      // El error se maneja en el AuthContext
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
