import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { requireInstitutionAccess } from "@/lib/authz";
import { calculateEppStatus } from "../utils/calculateEPPStatus";

interface ImportRow {
  code: string;
  branch: string;
  service: string;
  fabrication_year: number;
  fabrication_month?: number;
  caducidad_years?: number;
}

export async function importEppsHandler(req: NextRequest) {
  try {
    const access = await requireInstitutionAccess(req);
    if (!access.ok) return access.res;

    const user = access.user;

    const body = await req.json();
    const { institution_id: bodyInstitutionId, rows } = body as {
      institution_id?: number;
      rows: ImportRow[];
    };

    const institution_id =
      user.role === "admin" ? Number(bodyInstitutionId) : user.institution_id;

    if (!institution_id) {
      return NextResponse.json(
        { message: user.role === "admin" ? "Falta institution_id" : "Usuario sin institución" },
        { status: 400 },
      );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { message: "No hay filas para importar" },
        { status: 400 },
      );
    }

    // Verify institution exists
    const [instRows]: any = await connection.execute(
      `SELECT name FROM institutions WHERE id = ?`,
      [institution_id],
    );
    if (!instRows?.length) {
      return NextResponse.json({ message: "Institución inválida" }, { status: 400 });
    }

    // Get existing codes for this institution to detect duplicates
    const [existingRows]: any = await connection.execute(
      `SELECT code FROM epps WHERE institution_id = ?`,
      [institution_id],
    );
    const existingCodes = new Set<string>(existingRows.map((r: any) => r.code));

    const currentYear = new Date().getFullYear();
    const seenCodes = new Set<string>();

    let inserted = 0;
    const skipped: Array<{ row: number; code: string; reason: string }> = [];
    const errors: Array<{ row: number; code?: string; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const code = String(row.code ?? "").trim();
      const branch = String(row.branch ?? "").trim();
      const service = String(row.service ?? "").trim();
      const fabrication_year = Number(row.fabrication_year);
      const fabrication_month = row.fabrication_month ? Number(row.fabrication_month) : 1;
      const caducidad_years = row.caducidad_years ? Number(row.caducidad_years) : 5;

      // Required fields
      if (!code) {
        errors.push({ row: rowNum, reason: "Código vacío" });
        continue;
      }
      if (!branch) {
        errors.push({ row: rowNum, code, reason: "Tipo EPP vacío" });
        continue;
      }
      if (!service) {
        errors.push({ row: rowNum, code, reason: "Servicio vacío" });
        continue;
      }
      if (isNaN(fabrication_year) || fabrication_year < 1900 || fabrication_year > currentYear) {
        errors.push({ row: rowNum, code, reason: `Año inválido: ${row.fabrication_year}` });
        continue;
      }

      // Length limits
      if (code.length > 100) {
        errors.push({ row: rowNum, code, reason: "Código demasiado largo (máx 100)" });
        continue;
      }
      if (branch.length > 100) {
        errors.push({ row: rowNum, code, reason: "Tipo EPP demasiado largo (máx 100)" });
        continue;
      }
      if (service.length > 100) {
        errors.push({ row: rowNum, code, reason: "Servicio demasiado largo (máx 100)" });
        continue;
      }

      // Duplicate in upload batch
      if (seenCodes.has(code)) {
        skipped.push({ row: rowNum, code, reason: "Código duplicado en el archivo" });
        continue;
      }
      seenCodes.add(code);

      // Duplicate in DB
      if (existingCodes.has(code)) {
        skipped.push({ row: rowNum, code, reason: "Ya existe en la base de datos" });
        continue;
      }

      // Calculate derived fields
      const caducidad_month = fabrication_month;
      const caducidad_year = fabrication_year + caducidad_years;
      const inspection_freq = "ANNUAL";

      const { computedStatus } = calculateEppStatus({
        status: "APPROVED",
        fabrication_year,
        fabrication_month,
        caducidad_year,
        caducidad_month,
        inspection_freq,
        lastInspectionAt: null,
        openTasksCount: 0,
      });

      try {
        const [result]: any = await connection.execute(
          `INSERT INTO epps
            (code, institution_id, branch, service,
             fabrication_month, fabrication_year,
             caducidad_month, caducidad_year,
             caducidad_years, inspection_freq,
             status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            institution_id,
            branch,
            service,
            fabrication_month,
            fabrication_year,
            caducidad_month,
            caducidad_year,
            caducidad_years,
            inspection_freq,
            computedStatus,
            user.id,
          ],
        );

        await connection.execute(
          `INSERT INTO epp_logs (epp_id, user_id, type, details)
           VALUES (?, ?, ?, JSON_OBJECT("action","IMPORT","code",?))`,
          [result.insertId, user.id, "CREATE", code],
        );

        existingCodes.add(code); // prevent duplicates from later rows
        inserted++;
      } catch (err: any) {
        errors.push({ row: rowNum, code, reason: err?.message ?? "Error al insertar" });
      }
    }

    return NextResponse.json({ inserted, skipped, errors }, { status: 200 });
  } catch (error) {
    console.error("Error en importEppsHandler:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
