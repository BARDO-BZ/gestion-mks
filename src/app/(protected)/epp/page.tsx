"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EppsView } from "@/features/epps/components";

export default function EPP() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No autorizado</div>
      </div>
    );
  }

  return (
    <div className="h-100%">
      <EppsView />
    </div>
  );
}
