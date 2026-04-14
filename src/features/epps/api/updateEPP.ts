import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { assertEppAccess } from "@/features/epps/utils/assertEppAccess";
import { addEppLog } from "../utils/addEppLog";

interface UpdateEppBody {
  code?: string;
  branch?: string;
  service?: string;
  epp_type?: string | null;
  details?: string | null;
  fabrication_month?: number;
  fabrication_year?: number;
  caducidad_years?: number;
  inspection_freq?: "ANNUAL" | "SEMESTRAL";
}

export async function updateEppHandler(req: NextRequest, eppId: string) {
  try {
    const idNum = Number(eppId);
    const access = await assertEppAccess(req, idNum);
    if (!access.ok) return access.res;
    const user = access.user;

    const body = (await req.json().catch(() => ({}))) as UpdateEppBody;

    // Traer EPP actual
    const [eppRows]: any = await connection.execute(
      `SELECT * FROM epps WHERE id = ?`,
      [idNum],
    );
    if (!eppRows?.length) {
      return NextResponse.json({ message: "EPP no encontrado" }, { status: 404 });
    }
    const epp = eppRows[0] as any;

    // Valores finales (mantener los actuales si no se envía)
    const code          = body.code !== undefined          ? String(body.code).trim()          : epp.code;
    const branch        = body.branch !== undefined        ? String(body.branch).trim()        : epp.branch;
    const service       = body.service !== undefined       ? String(body.service).trim()       : epp.service;
    const epp_type      = body.epp_type !== undefined      ? (body.epp_type ? String(body.epp_type).trim() : null) : epp.epp_type;
    const details       = body.details !== undefined       ? (body.details ? String(body.details).trim() : null)   : epp.details;
    const fab_month     = body.fabrication_month !== undefined ? Number(body.fabrication_month) : epp.fabrication_month;
    const fab_year      = body.fabrication_year  !== undefined ? Number(body.fabrication_year)  : epp.fabrication_year;
    const cad_years     = body.caducidad_years   !== undefined ? Number(body.caducidad_years)   : epp.caducidad_years;
    const insp_freq     = body.inspection_freq   !== undefined ? body.inspection_freq            : epp.inspection_freq;

    // Validaciones mínimas
    if (!code)   return NextResponse.json({ message: "El código es requerido" }, { status: 400 });
    if (!branch) return NextResponse.json({ message: "La sucursal es requerida" }, { status: 400 });
    if (!service) return NextResponse.json({ message: "El servicio es requerido" }, { status: 400 });

    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(fab_year) || fab_year < 1900 || fab_year > currentYear) {
      return NextResponse.json({ message: `Año de fabricación inválido (1900–${currentYear})` }, { status: 400 });
    }
    if (!Number.isInteger(fab_month) || fab_month < 1 || fab_month > 12) {
      return NextResponse.json({ message: "Mes de fabricación inválido (1–12)" }, { status: 400 });
    }

    const cad_month = fab_month;
    const cad_year  = fab_year + cad_years;

    await connection.execute(
      `UPDATE epps SET
        code = ?, branch = ?, service = ?, epp_type = ?, details = ?,
        fabrication_month = ?, fabrication_year = ?,
        caducidad_month = ?, caducidad_year = ?,
        caducidad_years = ?, inspection_freq = ?
       WHERE id = ?`,
      [code, branch, service, epp_type, details, fab_month, fab_year, cad_month, cad_year, cad_years, insp_freq, idNum],
    );

    await addEppLog(idNum, user.id, "EDIT", { fields: Object.keys(body) });

    const [rows]: any = await connection.execute(
      `SELECT e.*, i.name AS institution_name FROM epps e LEFT JOIN institutions i ON i.id = e.institution_id WHERE e.id = ?`,
      [idNum],
    );

    return NextResponse.json({ epp: rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Error en updateEppHandler:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
