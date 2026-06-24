import { NextRequest, NextResponse } from "next/server";
import { sendDailyNotification, notifyOverdueInspections } from "@/lib/notificationService";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  // Responde inmediatamente para no hacer timeout en cron-job.org
  Promise.resolve().then(async () => {
    try {
      await sendDailyNotification();
    } catch (e) {
      console.error("cron/daily sendDailyNotification error:", e);
    }
    try {
      await notifyOverdueInspections();
    } catch (e) {
      console.error("cron/daily notifyOverdueInspections error:", e);
    }
  });

  return NextResponse.json({ started: true });
}
