import { NextRequest, NextResponse } from "next/server";
import { registerHandler } from "@/features/users/api/register";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = {
    status: (statusCode: number) => ({
      json: (data: any) => NextResponse.json(data, { status: statusCode }),
    }),
    setHeader: (_name: string, _value: string) => {},
  };

  return registerHandler({ method: "POST", body } as any, res as any);
}
