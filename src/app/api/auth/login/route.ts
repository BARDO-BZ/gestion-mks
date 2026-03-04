import { NextRequest, NextResponse } from "next/server";
import { loginHandler } from "@/features/users/api";
import { isRateLimited } from "@/lib/loginRateLimiter";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Demasiados intentos fallidos. Esperá 15 minutos e intentá de nuevo." },
      { status: 429 },
    );
  }

  const body = await req.json();
  return loginHandler(body, ip);
}
