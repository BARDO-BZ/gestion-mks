import React, { useState } from "react";
import { Form, Input, Button } from "@heroui/react";

export function ResetPassword() {
  const [userInfo, setUserInfo] = useState({ email: "" });

  const onSubmit = (e: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    e.preventDefault();
    console.log(userInfo);
  };

  return (
    <Form
      className="w-full flex flex-col items-stretch mt-8"
      onSubmit={onSubmit}
    >
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
        className="mt-8"
        onValueChange={(e) => setUserInfo({ ...userInfo, email: e })}
      />
      <Button className="mt-4" type="submit" color="primary">
        Recuperar contraseña
      </Button>
    </Form>
  );
}
