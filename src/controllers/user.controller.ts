import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import prisma from "../database/prismaClient";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

export interface UserRequest extends Request {
  user: User;
}


export const getMyProfile = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isDeveloper: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) return next(new ErrorHandler("User not found", 404));

      res.json({ success: true, user });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateMyProfile = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { name, isDeveloper } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          isDeveloper,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isDeveloper: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        message: "Profile Updated Successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return next(new ErrorHandler("Internal server error", 500));
    }
  }
);

//Delete My Profile