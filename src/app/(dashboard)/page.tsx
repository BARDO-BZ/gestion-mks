"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@heroui/react";

export default function Dashboard() {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {user.name} {user.lastName}
              </span>
              <Button color="danger" variant="ghost" onPress={logout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Información del Usuario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Nombre:</strong> {user.name}
              </div>
              <div>
                <strong>Apellido:</strong> {user.lastName}
              </div>
              <div>
                <strong>Rol:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-800"
                      : user.role === "staff"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div>
                <strong>Estado:</strong>
                <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                  {user.status}
                </span>
              </div>
              <div>
                <strong>Último acceso:</strong>{" "}
                {user.last_login
                  ? new Date(user.last_login).toLocaleString("es-AR")
                  : "Nunca"}
              </div>
              <div>
                <strong>Registrado:</strong>{" "}
                {new Date(user.created_at).toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
