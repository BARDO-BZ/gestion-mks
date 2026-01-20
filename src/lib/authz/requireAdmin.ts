import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./requireAuth";

export async function requireAdmin(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;

  if (auth.user.role !== "admin") {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "No autorizado" }, { status: 403 }),
    };
  }

  return auth; // { ok:true, user }
}
