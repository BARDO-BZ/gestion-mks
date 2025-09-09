"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(
        pathname
      )}`;
      router.replace(redirectUrl);
      setRedirected(true);
    }
  }, [user, loading, router, pathname, redirectTo]);

  return { user, loading, isAuthenticated: !!user, redirected };
}
