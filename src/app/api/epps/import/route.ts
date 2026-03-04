import { importEppsHandler } from "@/features/epps/api/importEPPs";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return importEppsHandler(req);
}
