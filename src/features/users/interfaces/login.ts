import { RowDataPacket } from "mysql2";

export interface ILoginBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IUserWithToken extends RowDataPacket {
  id: number;
  email: string;
  reset_token: string;
  reset_token_expiry: Date;
}

export interface IForgotPasswordBody {
  token: string;
  password: string;
}

export interface IJWTPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface IExistingUser extends RowDataPacket {
  id: number;
  email: string;
}
