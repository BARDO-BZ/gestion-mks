import { NextRequest } from "next/server";
import { listUsersAdminHandler } from "@/features/users/api/admin/listUsers";
import { createUserAdminHandler } from "@/features/users/api/admin/createUser";

export async function GET(req: NextRequest) {
  return listUsersAdminHandler(req);
}

export async function POST(req: NextRequest) {
  return createUserAdminHandler(req);
}
