import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authz/requireAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ message: "URL requerida" }, { status: 400 });
  }

  const blobResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!blobResponse.ok) {
    return NextResponse.json({ message: "Imagen no encontrada" }, { status: 404 });
  }

  const contentType = blobResponse.headers.get("content-type") ?? "image/jpeg";
  const buffer = await blobResponse.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
