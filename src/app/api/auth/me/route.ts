import { NextRequest, NextResponse } from "next/server";
import { meHandler } from "@/features/users/api";
import { getAuthUser } from "@/lib/auth";
import connection from "@/lib/db";

export async function GET(req: NextRequest) {
  return meHandler(req);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, last_name, email } = body;

  if (!name?.trim() || !last_name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { message: "Nombre, apellido y email son requeridos" },
      { status: 400 },
    );
  }

  if (email !== user.email) {
    const [rows]: any = await connection.execute(
      `SELECT id FROM users WHERE email = ? AND id != ?`,
      [email, user.id],
    );
    if (rows.length > 0) {
      return NextResponse.json({ message: "Ese email ya está en uso" }, { status: 409 });
    }
  }

  await connection.execute(
    `UPDATE users SET name = ?, last_name = ?, email = ? WHERE id = ?`,
    [name.trim(), last_name.trim(), email.trim(), user.id],
  );

  return NextResponse.json({ ok: true });
}
