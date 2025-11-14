import { NextRequest } from "next/server";
import { listTasksHandler } from "@/features/epps/api/tasks";
import { closeTaskHandler } from "@/features/epps/api/tasks";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return listTasksHandler(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return closeTaskHandler(req, id);
}
