"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import type { PropsWithChildren } from "react";

export default function Providers({ children }: PropsWithChildren) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
