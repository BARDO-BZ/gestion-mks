import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getAuthUser } from "@/lib/auth";
import connection from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return NextResponse.json(
      { message: "Contraseña actual y nueva son requeridas" },
      { status: 400 },
    );
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { message: "La nueva contraseña debe tener al menos 8 caracteres" },
      { status: 400 },
    );
  }

  const [rows]: any = await connection.execute(
    `SELECT password_hash FROM users WHERE id = ?`,
    [user.id],
  );

  const valid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!valid) {
    return NextResponse.json({ message: "La contraseña actual es incorrecta" }, { status: 400 });
  }

  const hash = await bcrypt.hash(new_password, 10);
  await connection.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, user.id]);

  return NextResponse.json({ ok: true });
}
