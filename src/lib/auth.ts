import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IJWTPayload } from "@/features/users/interfaces";

export type UserRole = "admin" | "client";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  last_name: string | null;
  role: UserRole;
  status: "active" | "pending" | "inactive" | string;
  institution_id: number | null;
}

export function isAdmin(user: AuthUser) {
  return user.role === "admin";
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

    const [rows]: any = await connection.execute(
      `SELECT id, email, name, last_name, role, status, institution_id
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [decoded.userId],
    );

    if (!rows || rows.length === 0) return null;

    const user = rows[0] as AuthUser;

    // 🔒 Regla clave:
    // Cliente sin institución => no autorizado
    if (user.status !== "active") return null;

    if (user.role === "client" && !user.institution_id) return null;

    // Admin puede tener institution_id = null
    return user;
  } catch {
    return null;
  }
}
