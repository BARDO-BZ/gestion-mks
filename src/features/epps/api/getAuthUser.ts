import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import connection from "@/lib/db";
import { IJWTPayload } from "@/features/users/interfaces";

export async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

    const [rows]: any = await connection.execute(
      `SELECT id, email, name, last_name, role, status
       FROM users
       WHERE id = ? AND status = "active"`,
      [decoded.userId]
    );

    if (!rows || rows.length === 0) return null;

    return rows[0];
  } catch (error) {
    return null;
  }
}
