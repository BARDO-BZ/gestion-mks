import { RowDataPacket } from "mysql2";

export interface IUser extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  status: "active" | "blocked" | "archived" | "pending";
  role: "admin" | "staff" | "client";
  name: string;
  lastName: string;
  last_login: Date | null;
}
