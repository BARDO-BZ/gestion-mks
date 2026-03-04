import { getDashboardStatsHandler } from "@/features/dashboard/api/getDashboardStats";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getDashboardStatsHandler(req);
}
