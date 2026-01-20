import { NextRequest, NextResponse } from "next/server";
import { listInstitutionsHandler } from "@/features/institutions/api/admin/listInstitutions";
import { createInstitutionHandler } from "@/features/institutions/api/admin/createInstitution";

export async function GET(req: NextRequest) {
  return listInstitutionsHandler(req);
}

export async function POST(req: NextRequest) {
  return createInstitutionHandler(req);
}
