import { logoutHandler } from "@/features/users/api";

export async function POST() {
  return logoutHandler();
}
