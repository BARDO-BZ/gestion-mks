import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "admin" | "client";
    };
  }

  interface User {
    id: string;
    role: "admin" | "client";
  }
}
