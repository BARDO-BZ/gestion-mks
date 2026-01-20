import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { ICreateEppBody } from "../interfaces/epp";
import { getAuthUser } from "@/lib/auth";

export async function createEppHandler(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as ICreateEppBody;

    const institution_id =
      user.role === "admin" ? Number(body.institution_id) : user.institution_id;

    if (user.role !== "admin" && !institution_id) {
      return NextResponse.json(
        { message: "Usuario sin institución" },
        { status: 403 },
      );
    }

    if (user.role === "admin" && !institution_id) {
      return NextResponse.json(
        { message: "Falta institution_id" },
        { status: 400 },
      );
    }

    const {
      code,
      branch,
      service,
      fabrication_month,
      fabrication_year,
      caducidad_years,
      inspection_freq,
    } = body;

    if (
      !code ||
      !branch ||
      !service ||
      !fabrication_month ||
      !fabrication_year
    ) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 },
      );
    }

    // Traer el nombre real de la institución (para display/legacy)
    const [instRows]: any = await connection.execute(
      `SELECT name FROM institutions WHERE id = ?`,
      [institution_id],
    );

    if (!instRows?.length) {
      return NextResponse.json(
        { message: "Institución inválida" },
        { status: 400 },
      );
    }

    const institutionName = instRows[0].name as string;

    const cadYears = caducidad_years ?? 5;
    const inspFreq = inspection_freq ?? "ANNUAL";

    const caducidad_month = fabrication_month;
    const caducidad_year = fabrication_year + cadYears;

    const [result]: any = await connection.execute(
      `INSERT INTO epps
        (code, institution_id, institution, branch, service,
         fabrication_month, fabrication_year,
         caducidad_month, caducidad_year,
         caducidad_years, inspection_freq,
         status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        institution_id,
        institutionName, // legacy display hasta que borres la columna
        branch,
        service,
        fabrication_month,
        fabrication_year,
        caducidad_month,
        caducidad_year,
        cadYears,
        inspFreq,
        "APPROVED",
        user.id,
      ],
    );

    const insertedId = result.insertId as number;

    await connection.execute(
      `INSERT INTO epp_logs (epp_id, user_id, type, details)
       VALUES (?, ?, ?, JSON_OBJECT("action","CREATE","code",?))`,
      [insertedId, user.id, "CREATE", code],
    );

    const [rows]: any = await connection.execute(
      `
      SELECT e.*, i.name AS institution_name
      FROM epps e
      LEFT JOIN institutions i ON i.id = e.institution_id
      WHERE e.id = ?
      `,
      [insertedId],
    );

    return NextResponse.json({ epp: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error en createEppHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
