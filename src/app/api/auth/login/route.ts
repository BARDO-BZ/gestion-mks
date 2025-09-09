import { NextRequest } from "next/server";
import { loginHandler } from "@/features/users/api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return loginHandler(body);
}
