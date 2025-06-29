import { Request, Response, NextFunction } from "express";
import prisma from "../database/prismaClient";
import { hashPassword, verifyPassword, generateToken } from "./auth.utils";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
// import { User } from "@prisma/client";
import { UserRequest } from "../controllers/admin.controller";

// interface AuthPayload {
//   user: User;
// }

// interface AuthRequest extends Request {
//   user?: AuthPayload;
// }

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

export const checkAuth = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new ErrorHandler("Not authenticated", 401));
      // console.log("Authenticated user:", req.user);
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include:{
          // purchases:true,
          uploadedWorkers:true,
          jobs:true,
          reviews:true
        }
      });

      if (!user) return next(new ErrorHandler("User not found", 404));

      const { passwordHash, ...userWithoutPassword } = user;
      return res.status(200).json({
        user: userWithoutPassword,
      });
    } catch (error: any) {
      console.error("Error during authentication check:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        return next(new ErrorHandler("Email already in use", 400));
      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: { name, email, passwordHash },
      });

      const token = generateToken(user);
      res.cookie("token", token, cookieOptions);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error: any) {
      console.error("Error during registration:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // console.log("Login request body:", req);
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return next(new ErrorHandler("Invalid Credentials", 401));

      if (user) {
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return next(new ErrorHandler("Invalid Credentials", 401));

        const token = generateToken(user);
        res.cookie("token", token, cookieOptions);
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isDeveloper: user.isDeveloper,
        });
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Forgot Password
export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) res.status(404).json({ message: "User not found" });

      res.json({ message: "Password reset link sent to your email" });
    } catch (error: any) {
      console.error("Error during forgot password:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Logout
export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // res.cookie("token", "");
    try {
      res.clearCookie("token");
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Error during logout:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Auth✔️❌⌛
