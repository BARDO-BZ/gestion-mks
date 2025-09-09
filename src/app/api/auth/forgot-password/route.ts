import { NextRequest } from "next/server";
import { forgotPasswordHandler } from "@/features/users/api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return forgotPasswordHandler(body);
}
