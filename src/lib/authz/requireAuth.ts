import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function requireAuth(req: NextRequest) {
  const user = await getAuthUser(req);

  if (!user) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  return { ok: true as const, user };
}
