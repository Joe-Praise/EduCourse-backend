import { Query } from "mongoose";
import { UserType } from "../models/userModel.js";

export type ThisQuery<T> = Query<T, T>;

export interface CookieOptions {
  expires: Date;
  httpOnly: boolean;
  secure?: boolean;
}

import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: UserType;
}


export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface SignupRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
}

export interface UpdatePasswordRequest extends AuthenticatedRequest {
  body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
}