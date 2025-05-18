import { Request, Response, NextFunction } from "express";
import prisma from "../database/prismaClient";
import { hashPassword, verifyPassword, generateToken } from "./auth.utils";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

export const register = catchAsync(async (req: Request, res: Response, next:NextFunction) => {
  try{
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) res.status(400).json({ message: "Email already in use" });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}catch (error:any) {
  console.error("Error during registration:", error);
  return next(new ErrorHandler(error.message, 500));
}
});

export const login = catchAsync(async (req: Request, res: Response, next:NextFunction): Promise<void> => {
 
  // console.log("Login request body:", req);
  try{const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(new ErrorHandler("Invalid Credentials", 401));

  if (user) {
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return next(new ErrorHandler("Invalid Credentials", 401));

    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }}catch (error:any) {
    console.error("Error during login:", error);
    return next(new ErrorHandler(error.message, 500));

  }
});

//Forgot Password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) res.status(404).json({ message: "User not found" });

  // Generate a password reset token and send it to the user's email
  // ...

  res.json({ message: "Password reset link sent to your email" });
};

//Logout
export const logout = catchAsync(async (req: Request, res: Response, next:NextFunction): Promise<void> => {
  // res.cookie("token", "");
  try{res.clearCookie('token');
  res.json({ message: "Logged out successfully" });
}catch (error:any) {
  console.error("Error during logout:", error);
  return next(new ErrorHandler(error.message, 500));
}
});