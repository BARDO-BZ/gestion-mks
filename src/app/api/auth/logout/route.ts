import { logoutHandler } from "@/features/users/api/logout";

export async function POST() {
  return logoutHandler();
}
