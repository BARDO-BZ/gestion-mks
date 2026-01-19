"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { User as UserUI } from "@heroui/react";
import {
  LogoutIcon,
  DashboardIcon,
  ShieldIcon,
  InspectionIcon,
  FileIcon,
  SettingsIcon,
  HelpIcon,
} from "@/components/Icon";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Role = "admin" | "client";

type NavItem = {
  href: string;
  label: string;
  // Componente de ícono que acepta prop color?: string
  Icon: React.ComponentType<{ color?: string }>;
  // Si requiere rol específico
  roles?: Role[];
};

const ALL_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/epp", label: "EPP", Icon: ShieldIcon },
  { href: "/inspections", label: "Inspecciones", Icon: InspectionIcon },
  { href: "/reports", label: "Reportes", Icon: FileIcon },
  {
    href: "/admin/users",
    label: "Usuarios",
    Icon: SettingsIcon,
    roles: ["admin"],
  },
  {
    href: "/settings",
    label: "Configuración",
    Icon: SettingsIcon,
    roles: ["admin"],
  },
];

function isActive(pathname: string, href: string) {
  // activo en ruta exacta o en subrutas
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      className={`nav-link ${active ? "nav-link-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon color={active ? "#3b82f6" : undefined} />
      {item.label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const role: Role = user?.role === "admin" ? "admin" : "client";

  const visibleItems = useMemo(
    () => ALL_ITEMS.filter((it) => !it.roles || it.roles.includes(role)),
    [role],
  );

  const displayName = useMemo(() => {
    if (loading) return "Cargando...";
    const fullName = `${user?.name ?? ""} ${user?.lastName ?? ""}`.trim();
    return fullName || user?.email || "Usuario";
  }, [loading, user?.name, user?.lastName, user?.email]);

  return (
    <aside className="w-[17%] pl-8 pr-8 pt-6 pb-6 flex flex-col h-[100vh] justify-between border-r border-gray-200">
      <div>
        <Image
          src="/logo.png"
          width={100}
          height={40}
          alt="MKS - Protección radiológica"
          className="mx-auto"
          priority
        />

        <nav className="flex flex-col mt-12 gap-2">
          <span className="text-xs opacity-50 mb-2">MENU</span>

          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>
      </div>

      <div className="flex flex-col mt-12 gap-2">
        <span className="text-xs opacity-50 mb-2">GENERAL</span>

        <Link href="/tutoriales" className="nav-link">
          <HelpIcon />
          Tutoriales
        </Link>

        <button type="button" onClick={logout} className="nav-link">
          <LogoutIcon />
          Cerrar sesión
        </button>

        <div className="flex items-center justify-between mt-8">
          <UserUI
            name={displayName}
            description={!loading ? user?.email : undefined}
          />
        </div>
      </div>
    </aside>
  );
}
