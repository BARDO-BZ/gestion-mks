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
          <main className="light mx-auto w-[90vw] max-w-[1366px] mt-[2%]">
            {children}
          </main>
        </HeroUIProvider>
      </body>
    </html>
  );
}
