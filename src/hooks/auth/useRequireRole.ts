"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "admin" | "staff" | "client";

export function useRequireRole(
  requiredRoles: UserRole | UserRole[],
  redirectTo: string = "/unauthorized"
) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      if (!roles.includes(user.role)) {
        router.replace(redirectTo);
        setRedirected(true);
      }
    }
  }, [user, loading, router, requiredRoles, redirectTo]);

  const hasAccess = user
    ? Array.isArray(requiredRoles)
      ? requiredRoles.includes(user.role)
      : user.role === requiredRoles
    : false;

  return { user, loading, hasAccess, redirected };
}
