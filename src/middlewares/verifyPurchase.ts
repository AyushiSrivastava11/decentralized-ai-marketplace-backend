import { NextFunction, Request, Response } from "express";
import prisma from "../database/prismaClient";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsync } from "./catchAsyncError";

export const verifyPurchase = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, aiWorkerId } = req.body;

  if (!userId || !aiWorkerId) {
    return next(new ErrorHandler("Missing userId or aiWorkerId", 400));
  }

  const paidOrder = await prisma.order.findFirst({
    where: {
      userId,
      aiWorkerId,
      status: "PAID",
    },
  });

  if (!paidOrder) {
    return next(new ErrorHandler("Purchase required for API key generation", 403));
  }

  next();
});
