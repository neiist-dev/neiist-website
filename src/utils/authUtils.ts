import jwt from "jsonwebtoken";
import { UserRole } from "@/types/user";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  istid: string;
  roles: UserRole[];
  name: string;
  email: string;
}

export function signUserJWT(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function getUserFromJWT(token: string | undefined): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
