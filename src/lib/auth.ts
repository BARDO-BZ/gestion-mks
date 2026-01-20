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
      `SELECT 
     u.id, u.email, u.name, u.last_name, u.role, u.status, u.institution_id,
     i.status AS institution_status
   FROM users u
   LEFT JOIN institutions i ON i.id = u.institution_id
   WHERE u.id = ?
   LIMIT 1`,
      [decoded.userId],
    );

    if (!rows || rows.length === 0) return null;

    const user = rows[0] as AuthUser & {
      institution_status?: "active" | "inactive" | null;
    };

    // 1) status de usuario
    if (user.status !== "active") return null;

    // 2) regla clave client: debe tener institución
    if (user.role === "client" && !user.institution_id) return null;

    // 3) institución inactiva: no entra (para client; para admin lo ignoramos)
    if (user.role === "client" && user.institution_status === "inactive") {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
