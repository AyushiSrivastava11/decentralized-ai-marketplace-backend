import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import prisma from "../database/prismaClient";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { aiWorkerSelectFields } from "./aiworker.controller";

export interface UserRequest extends Request {
  user: User;
}
export const aiWorkerForAllDetails = {
  id: true,
  name: true,
  description: true,
  tags: true,
  // filePath: true,
  inputSchema: true,
  outputSchema: true,
  developerId: true,
  pricePerRun: true,
};

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
export const deleteMyProfile = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
 try {
  const userId = req.user.id;

  // 1. Delete dependent AIWorker records
  await prisma.aIWorker.deleteMany({
    where: { developerId: userId },
  });

  // 2. Delete dependent Job records
  await prisma.job.deleteMany({
    where: { userId: userId },
  });

  // 3. Now delete the user
  await prisma.user.delete({
    where: { id: userId },
  });

  res.json({ success: true, message: "Profile Deleted Successfully" });
} catch (error) {
  console.error("Delete profile error:", error);
  return next(new ErrorHandler("Internal server error", 500));
}


});

//Get AI Worker by ID for Users
export const getAIWorkerByIdForUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // For AI Worker ID
      const aiWorker = await prisma.aIWorker.findUnique({
  where: {
    id,
    status: "APPROVED",
  },
  select: {
    id: true,
    name: true,
    description: true,
    tags: true,
    inputSchema: true,
    outputSchema: true,
    developerId: true,
    pricePerRun: true,
    isPublic: true,
    filePath: true,
    createdAt: true,
    updatedAt: true,
    status: true,
    rejectionReason: true,
    developer: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
});

      console.log("AI Worker Details:", aiWorker);
      if (!aiWorker) {
        return next(new ErrorHandler("AI Worker not found", 404));
      }
      res.json({ success: true, aiWorker });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const checkPurchaseStatus = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { userId, workerId } = req.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        userId,
        aiWorkerId: workerId,
        status: "PAID",
      },
    });

    if (order) {
      return res.status(200).json({ owns: true });
    } else {
      return res.status(200).json({ owns: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
  });