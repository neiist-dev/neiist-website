import { UserData } from "./auth/dto";

declare module 'express-session' {
  interface SessionData {
    user: UserData;
  }
}