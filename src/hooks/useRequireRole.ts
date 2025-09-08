import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "admin" | "staff" | "client";

export function useRequireRole(
  requiredRoles: UserRole | UserRole[],
  redirectTo: string = "/unauthorized"
) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      if (!roles.includes(user.role)) {
        router.push(redirectTo);
      }
    }
  }, [user, loading, router, requiredRoles, redirectTo]);

  return {
    user,
    loading,
    hasAccess: user
      ? Array.isArray(requiredRoles)
        ? requiredRoles.includes(user.role)
        : user.role === requiredRoles
      : false,
  };
}
