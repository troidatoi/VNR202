import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

export interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    email: string;
    username: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Bỏ qua xác thực, cho phép mọi request
  next();
};
