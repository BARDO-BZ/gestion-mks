import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

export async function createUserAdminHandler(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { email, password, name, last_name, role = "client", institution_id, status = "active" } = body;

  if (!email || !password || !name || !last_name) {
    return NextResponse.json({ message: "Email, contraseña, nombre y apellido son requeridos" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: "Formato de email inválido" }, { status: 400 });
  }

  if (password.length < 8 || password.length > 72) {
    return NextResponse.json({ message: "La contraseña debe tener entre 8 y 72 caracteres" }, { status: 400 });
  }

  if (!["admin", "client"].includes(role)) {
    return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
  }

  if (!["active", "pending"].includes(status)) {
    return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
  }

  const institutionIdNum = institution_id != null ? Number(institution_id) : null;
  if (role === "client" && !institutionIdNum) {
    return NextResponse.json({ message: "Los usuarios client requieren una institución" }, { status: 400 });
  }

  try {
    const [existing]: any = await connection.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (existing.length > 0) {
      return NextResponse.json({ message: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result]: any = await connection.execute(
      `INSERT INTO users (email, password_hash, name, last_name, role, status, institution_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [email, passwordHash, name, last_name, role, status, institutionIdNum ?? null],
    );

    const newUserId = result.insertId;

    await logAdminAction({
      adminId: auth.id,
      action: "CREATE_USER",
      targetType: "user",
      targetId: newUserId,
      details: { email, role, status, institution_id: institutionIdNum },
    });

    return NextResponse.json({ message: "Usuario creado", id: newUserId }, { status: 201 });
  } catch (error) {
    console.error("createUserAdminHandler error:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
