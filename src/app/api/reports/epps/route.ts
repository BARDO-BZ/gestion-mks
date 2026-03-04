import { getReportHandler } from "@/features/reports/api/getReport";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getReportHandler(req);
}
