import { NextRequest } from "next/server";
import {
  listInspectionsHandler,
  createInspectionHandler,
} from "@/features/epps/api/inspections";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return listInspectionsHandler(req, id);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return createInspectionHandler(req, id);
}
