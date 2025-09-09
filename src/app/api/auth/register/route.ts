import { NextRequest } from "next/server";
import { registerHandler } from "@/features/users/api";

export async function POST(req: NextRequest) {
  return registerHandler(req);
}
