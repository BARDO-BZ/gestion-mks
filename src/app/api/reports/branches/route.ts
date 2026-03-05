import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireInstitutionAccess } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const access = await requireInstitutionAccess(req);
  if (!access.ok) return access.res;

  const user = access.user;
  const isAdmin = user.role === "admin";
  const { searchParams } = new URL(req.url);
  const institution_id = searchParams.get("institution_id") || "";

  const whereParts = ["e.status != 'DELETED'", "e.branch IS NOT NULL", "e.branch != ''"];
  const values: any[] = [];

  if (!isAdmin) {
    if (!user.institution_id) {
      return NextResponse.json({ data: [] });
    }
    whereParts.push("e.institution_id = ?");
    values.push(user.institution_id);
  } else if (institution_id) {
    whereParts.push("e.institution_id = ?");
    values.push(Number(institution_id));
  }

  const [rows]: any = await connection.execute(
    `SELECT DISTINCT e.branch FROM epps e WHERE ${whereParts.join(" AND ")} ORDER BY e.branch ASC`,
    values,
  );

  return NextResponse.json({ data: rows.map((r: any) => r.branch) });
}
