import { NextRequest } from "next/server";
import { forgotPasswordHandler } from "@/features/users/api/forgotPassword";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return forgotPasswordHandler(body);
}
