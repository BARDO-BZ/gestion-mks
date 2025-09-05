import React from "react";
import { Form, Input, Button, Checkbox } from "@heroui/react";
import { EyeSlashFilledIcon, EyeFilledIcon } from "@/components/Icon";
export function Login() {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = (e: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log(data);
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
