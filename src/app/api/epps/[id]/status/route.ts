import { NextRequest } from "next/server";
import { updateEppStatusHandler } from "@/features/epps/api";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateEppStatusHandler(req, id);
}
