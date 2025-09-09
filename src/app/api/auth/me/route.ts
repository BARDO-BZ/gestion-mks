import { NextRequest } from "next/server";
import { meHandler } from "@/features/users/api/me";

export async function GET(req: NextRequest) {
  return meHandler(req);
}
