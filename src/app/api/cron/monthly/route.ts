import { NextRequest, NextResponse } from "next/server";
import { sendMonthlySummary } from "@/lib/notificationService";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const result = await sendMonthlySummary();
  return NextResponse.json(result);
}
