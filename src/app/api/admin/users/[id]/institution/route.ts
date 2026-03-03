import { NextRequest } from "next/server";
import { updateUserInstitutionAdminHandler } from "@/features/users/api/admin/updateUserInstitution";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return updateUserInstitutionAdminHandler(req, id);
}
