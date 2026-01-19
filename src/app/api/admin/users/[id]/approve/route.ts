import { NextRequest } from "next/server";
import { approveUserAdminHandler } from "@/features/users/api/admin/approveUser";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return approveUserAdminHandler(req, params.id);
}
