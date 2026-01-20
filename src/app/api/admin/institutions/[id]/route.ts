import { NextRequest } from "next/server";
import { updateInstitutionHandler } from "@/features/institutions/api/admin/updateInstitution";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return updateInstitutionHandler(req, params.id);
}
