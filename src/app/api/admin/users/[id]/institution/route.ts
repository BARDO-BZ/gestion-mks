import { NextRequest } from "next/server";
import { updateUserInstitutionAdminHandler } from "@/features/users/api/admin/updateUserInstitution";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return updateUserInstitutionAdminHandler(req, params.id);
}
