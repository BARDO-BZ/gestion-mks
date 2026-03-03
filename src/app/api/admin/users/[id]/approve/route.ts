import { NextRequest } from "next/server";
import { approveUserAdminHandler } from "@/features/users/api/admin/approveUser";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return approveUserAdminHandler(req, id);
}
