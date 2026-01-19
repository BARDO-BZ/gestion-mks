import { RowDataPacket } from "mysql2";

export interface IUser extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  status: "active" | "blocked" | "archived" | "pending";
  role: TUserRole;
  name: string;
  last_name: string;
  last_login: Date | null;
  institution_id: number | null;
}

export interface IRegisterData {
  email: string;
  password: string;
  name: string;
  lastName: string;
  role?: TUserRole;
}

export type TUserRole = "admin" | "staff" | "client";
