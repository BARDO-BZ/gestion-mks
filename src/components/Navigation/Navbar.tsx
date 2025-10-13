"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, User as UserUI, Tooltip } from "@heroui/react";
import { LogoutIcon } from "@/components/Icon";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const role = user?.role === "admin" ? "admin" : "client";

  const baseLinks = [
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/epp", label: "EPP", show: true },
    { href: "/inspections", label: "Inspecciones", show: true },
    { href: "/reports", label: "Reportes", show: true },
    { href: "/settings", label: "Configuración", show: role === "admin" },
  ];

  const links = baseLinks.filter((l) => l.show);

  return (
    <aside className="w-[18%] pl-8 pr-8 pt-6 flex flex-col h-[98vh] justify-between border-r border-gray-200">
      <div>
        <Image
          src="/logo.png"
          width={100}
          height={40}
          alt="MKS - Protección radiológica"
          className="mx-auto"
        />

        <nav className="flex flex-col mt-8 gap-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                href={link.href}
                key={link.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        <Button size="sm" variant="flat">
          Tutoriales
        </Button>

        <div className="flex items-center justify-between">
          <UserUI
            name={
              loading
                ? "Cargando..."
                : `${user?.name ?? ""} ${user?.lastName ?? ""}`.trim() ||
                  user?.email ||
                  "Usuario"
            }
            description={!loading ? user?.email : undefined}
          />

          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="text-gray-500 hover:text-gray-800"
          >
            <Tooltip content="Cerrar sesión" placement="top-end" size="sm">
              <LogoutIcon />
            </Tooltip>
          </button>
        </div>
      </div>
    </aside>
  );
}
