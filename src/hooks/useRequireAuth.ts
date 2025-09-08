"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(
        pathname
      )}`;
      router.push(redirectUrl);
    }
  }, [user, loading, router, pathname, redirectTo]);

  return { user, loading };
}
