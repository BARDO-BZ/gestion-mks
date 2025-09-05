import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MKS",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      {/* Forzamos light a nivel HTML */}
      <body
        className={`${openSans.variable} font-sans bg-background text-foreground mx-auto w-[90vw] max-w-[1366px] mt-[2%]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
