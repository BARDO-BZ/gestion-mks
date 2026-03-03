import { NextRequest } from "next/server";
import { updateInstitutionStatusHandler } from "@/features/institutions/api/admin/updateInstitutionStatus";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return updateInstitutionStatusHandler(req, id);
}
