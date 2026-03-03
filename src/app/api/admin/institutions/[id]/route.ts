import { NextRequest } from "next/server";
import { updateInstitutionHandler } from "@/features/institutions/api/admin/updateInstitution";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateInstitutionHandler(req, id);
}
