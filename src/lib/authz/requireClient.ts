import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./requireAuth";

export async function requireClient(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;

  if (auth.user.role !== "client") {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "No autorizado" }, { status: 403 }),
    };
  }

  return auth;
}
