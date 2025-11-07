import "express-session";
// import { Types } from "mongoose";

declare module "express-session" {
  interface SessionData {
    user:{
      id:string;
      username: string;
      role?: string[];
       [key: string]: any;
    }
  }
}
