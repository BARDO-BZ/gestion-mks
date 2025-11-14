import { NextRequest } from "next/server";
import { createEppHandler } from "@/features/epps/api";

export async function POST(req: NextRequest) {
  return createEppHandler(req);
}
