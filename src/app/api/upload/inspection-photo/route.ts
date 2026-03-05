import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireInstitutionAccess } from "@/lib/authz";

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

export async function POST(req: NextRequest) {
  try {
    const access = await requireInstitutionAccess(req);
    if (!access.ok) return access.res;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No se recibió ningún archivo" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Formato no permitido. Usá JPG, PNG, WEBP o HEIC." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { message: `El archivo supera el límite de ${MAX_SIZE_MB}MB.` },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `inspections/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, file, {
      access: "private",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("Error en upload inspection-photo:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
