import React, { useState } from "react";
import { Form, Input, Button, Checkbox } from "@heroui/react";
import { EyeSlashFilledIcon, EyeFilledIcon } from "@/components/Icon";

export function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", password: "" });

  const toggleVisibility = () => setIsVisible(!isVisible);

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
      <Input
        isRequired
        errorMessage="Por favor ingresá un email válido"
        name="email"
        type="email"
        placeholder="Email"
        onValueChange={(e) => setUserInfo({ ...userInfo, email: e })}
      />
      <Input
        required
        endContent={
          <button
            aria-label="toggle password visibility"
            className="focus:outline-solid outline-transparent"
            type="button"
            onClick={toggleVisibility}
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
      />
      <Checkbox defaultSelected size="sm" className="mt-4">
        <p className="text-xs">Mantener sesión iniciada</p>
      </Checkbox>
      <Button type="submit" color="primary">
        Ingresar
      </Button>
    </Form>
  );
}
