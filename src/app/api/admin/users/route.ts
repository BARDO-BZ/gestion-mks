import { NextRequest } from "next/server";
import { listUsersAdminHandler } from "@/features/users/api/admin/listUsers";

export async function GET(req: NextRequest) {
  return listUsersAdminHandler(req);
}
