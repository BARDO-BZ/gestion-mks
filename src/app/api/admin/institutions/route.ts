import { NextRequest } from "next/server";
import { listInstitutionsAdminHandler } from "@/features/institutions/api/admin/listInstitutions";

export async function GET(req: NextRequest) {
  return listInstitutionsAdminHandler(req);
}
