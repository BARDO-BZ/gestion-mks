import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartCheck",
  description: "Gestión de Estado de EPP Radiológicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body
        className={`${inter.variable} font-sans bg-background text-foreground mx-auto w-[100vw] max-w-[1440px]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
