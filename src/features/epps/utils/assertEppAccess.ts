import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function assertEppAccess(req: NextRequest, eppId: number) {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "No autorizado" }, { status: 401 }),
    };
  }

  const [rows]: any = await connection.execute(
    `SELECT id, institution_id FROM epps WHERE id = ? LIMIT 1`,
    [eppId],
  );

  if (!rows?.length) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "EPP no encontrado" }, { status: 404 }),
    };
  }

  const epp = rows[0] as { id: number; institution_id: number | null };

  if (user.role !== "admin") {
    if (!user.institution_id) {
      return {
        ok: false as const,
        res: NextResponse.json(
          { message: "Usuario sin institución" },
          { status: 403 },
        ),
      };
    }
    if (epp.institution_id !== user.institution_id) {
      // 404 para no filtrar info
      return {
        ok: false as const,
        res: NextResponse.json(
          { message: "EPP no encontrado" },
          { status: 404 },
        ),
      };
    }
  }

  return { ok: true as const, user, eppInstitutionId: epp.institution_id };
}
