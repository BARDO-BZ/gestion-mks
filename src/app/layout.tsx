import { HeroUIProvider } from "@heroui/react";
import "@/styles/globals.css";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <HeroUIProvider>
          <main>{children}</main>
        </HeroUIProvider>
      </body>
    </html>
  );
}
