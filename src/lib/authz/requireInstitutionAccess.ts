import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./requireAuth";

export async function requireInstitutionAccess(
  req: NextRequest,
  resourceInstitutionId?: number | null,
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;

  const user = auth.user;

  // Admin ve todo
  if (user.role === "admin") {
    return { ok: true as const, user };
  }

  // Client necesita institución
  if (!user.institution_id) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { message: "Usuario sin institución" },
        { status: 403 },
      ),
    };
  }

  // Si el recurso tiene institución, debe coincidir
  if (
    typeof resourceInstitutionId === "number" &&
    resourceInstitutionId !== user.institution_id
  ) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "No autorizado" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}
