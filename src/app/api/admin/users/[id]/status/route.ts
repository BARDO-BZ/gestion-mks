import { NextRequest } from "next/server";
import { updateUserStatusAdminHandler } from "@/features/users/api/admin/updateUserStatus";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return updateUserStatusAdminHandler(req, params.id);
}
