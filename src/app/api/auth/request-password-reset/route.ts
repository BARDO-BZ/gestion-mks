import { NextRequest } from "next/server";
import { requestPasswordResetHandler } from "@/features/users/api/requestPasswordReset";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return requestPasswordResetHandler(body);
}
