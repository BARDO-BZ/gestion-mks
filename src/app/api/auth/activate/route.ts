import { NextRequest } from "next/server";
import { activateHandler } from "@/features/users/api";

export async function GET(req: NextRequest) {
  return activateHandler(req);
}
