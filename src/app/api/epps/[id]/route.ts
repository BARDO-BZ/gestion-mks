import { NextRequest } from "next/server";
import { getEppHandler } from "@/features/epps/api";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return getEppHandler(req, params.id);
}
