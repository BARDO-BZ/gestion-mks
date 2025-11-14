import { NextRequest } from "next/server";
import { listEppsHandler } from "@/features/epps/api/listEPPs";

export async function GET(req: NextRequest) {
  return listEppsHandler(req);
}
