import React from "react";
import Navbar from "@/components/Navigation/Navbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
