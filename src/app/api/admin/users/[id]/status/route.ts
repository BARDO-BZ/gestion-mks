import { NextRequest } from "next/server";
import { updateUserStatusAdminHandler } from "@/features/users/api/admin/updateUserStatus";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return updateUserStatusAdminHandler(req, id);
}
