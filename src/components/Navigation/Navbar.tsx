"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, User, Tooltip } from "@heroui/react";
import { LogoutIcon } from "@/components/Icon";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const role = user?.role === "admin" ? "admin" : "client";

  console.log("user", user);

  const linksAdmin = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin/epp", label: "EPP" },
    { href: "/admin/inspections", label: "Inspecciones" },
    { href: "/admin/reports", label: "Reportes" },
    { href: "/admin/settings", label: "Configuración" },
  ];

  const linksClient = [
    { href: "/client/dashboard", label: "Inicio" },
    { href: "/client/epp", label: "Mis EPP" },
    { href: "/client/inspections", label: "Revisiones" },
    { href: "/client/alerts", label: "Alertas" },
  ];

  const links = role === "admin" ? linksAdmin : linksClient;

  return (
    <div
      className="w-[18%] pl-[32px] pr-[32px] pt-[2%] flex flex-col h-[98vh] justify-between"
      style={{ borderRight: "1px solid #D4DDE4" }}
    >
      <div>
        <Image
          src="/logo.png"
          width={100}
          height={40}
          alt="MKS - Protección radiológica"
          className="mx-auto"
        />

        <div className="flex flex-col mt-[32px] gap-2">
          {links.map((link) => {
            // marca activo también en subrutas (e.g. /admin/epp/123)
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
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Button size="sm">Tutoriales</Button>

        <div className="flex items-center justify-between">
          <User
            avatarProps={{
              src: "",
            }}
            name={`${user?.name ?? ""} ${user?.last_name ?? ""}`.trim() || "U"}
          />
          <button type="button" onClick={logout} aria-label="Cerrar sesión">
            <Tooltip content="Cerrar sesión" placement="top-end" size="sm">
              <LogoutIcon />
            </Tooltip>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
