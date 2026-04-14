import { NextRequest } from "next/server";
import { getEppHandler } from "@/features/epps/api/getEPP";
import { updateEppHandler } from "@/features/epps/api/updateEPP";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return getEppHandler(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateEppHandler(req, id);
}
