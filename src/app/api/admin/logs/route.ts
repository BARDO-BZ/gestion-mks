import { NextRequest } from "next/server";
import { listAdminLogsHandler } from "@/features/users/api/admin/listAdminLogs";

export async function GET(req: NextRequest) {
  return listAdminLogsHandler(req);
}
