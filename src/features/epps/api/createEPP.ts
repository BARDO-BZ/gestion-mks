import { NextRequest, NextResponse } from "next/server";
import connection from "@/lib/db";
import { ICreateEppBody } from "../interfaces/epp";
import { getAuthUser } from "./getAuthUser";

export async function createEppHandler(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as ICreateEppBody;

    const {
      code,
      institution,
      branch,
      service,
      fabrication_month,
      fabrication_year,
      caducidad_years,
      inspection_freq,
    } = body;

    if (
      !code ||
      !institution ||
      !branch ||
      !service ||
      !fabrication_month ||
      !fabrication_year
    ) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const cadYears = caducidad_years ?? 5; // después lo podés parametrizar por cuenta
    const inspFreq = inspection_freq ?? "ANNUAL";

    const caducidad_month = fabrication_month;
    const caducidad_year = fabrication_year + cadYears;

    // Insertar en DB
    const [result]: any = await connection.execute(
      `INSERT INTO epps
        (code, institution, branch, service,
         fabrication_month, fabrication_year,
         caducidad_month, caducidad_year,
         caducidad_years, inspection_freq,
         status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        institution,
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
      ]
    );

    const insertedId = result.insertId as number;

    // Crear log
    await connection.execute(
      `INSERT INTO epp_logs (epp_id, user_id, type, details)
       VALUES (?, ?, ?, JSON_OBJECT("action","CREATE","code",?))`,
      [insertedId, user.id, "CREATE", code]
    );

    // Traer el registro recién creado
    const [rows]: any = await connection.execute(
      `SELECT * FROM epps WHERE id = ?`,
      [insertedId]
    );

    const epp = rows[0];

    return NextResponse.json({ epp }, { status: 201 });
  } catch (error) {
    console.error("Error en createEppHandler:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
