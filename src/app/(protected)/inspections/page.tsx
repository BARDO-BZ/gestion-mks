"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Inspections() {
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

  return <div>inspecciones</div>;
}
