import { NextFunction, Response } from "express";
import { AuthRequest } from "./authMiddleware";

export const ROLES = {
  ADMIN: "admin",
  CONSULTANT: "consultant",
  CUSTOMER: "customer",
} as const;

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Bỏ qua kiểm tra quyền, cho phép mọi request
    next();
  };
};
