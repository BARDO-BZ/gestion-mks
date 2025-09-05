import React, { useState } from "react";
import { Form, Input, Button } from "@heroui/react";

export function Register() {
  const [userInfo, setUserInfo] = useState({
    email: "",
    name: "",
    lastName: "",
  });

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
        correo electrónico de activación, haz clic en el enlace adjunto para
        activar tu cuenta.
      </p>
      <div className="w-full flex justify-between mt-8">
        <Input
          className="w-[48%]"
          isRequired
          name="name"
          type="text"
          placeholder="Nombre"
          onValueChange={(e) => setUserInfo({ ...userInfo, name: e })}
        />
        <Input
          className="w-[48%]"
          isRequired
          name="lastName"
          type="text"
          placeholder="Apellido"
          onValueChange={(e) => setUserInfo({ ...userInfo, lastName: e })}
        />
      </div>
      <Input
        isRequired
        errorMessage="Por favor ingresá un email válido"
        name="email"
        type="email"
        placeholder="Email"
        onValueChange={(e) => setUserInfo({ ...userInfo, email: e })}
      />
      <Button className="mt-4" type="submit" color="primary">
        Registrarse
      </Button>
    </Form>
  );
}
