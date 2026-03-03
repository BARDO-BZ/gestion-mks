import { NextRequest } from "next/server";
import { closeTaskHandler } from "@/features/epps/api/tasks";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await context.params;
  return closeTaskHandler(req, taskId);
}
