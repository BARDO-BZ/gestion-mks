import { NextRequest } from "next/server";
import { updateInstitutionStatusHandler } from "@/features/institutions/api/admin/updateInstitutionStatus";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return updateInstitutionStatusHandler(req, params.id);
}
