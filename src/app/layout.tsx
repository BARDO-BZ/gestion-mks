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
          <main className="text-foreground bg-background w-5/6 mx-auto mt-[2%]">
            {children}
          </main>
        </HeroUIProvider>
      </body>
    </html>
  );
}
