import { NextRequest } from "next/server";
import { getEppHandler } from "@/features/epps/api/getEPP";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return getEppHandler(req, id);
}
