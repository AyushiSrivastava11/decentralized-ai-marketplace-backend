import { NextFunction, Request, Response } from "express";
import prisma from "../database/prismaClient";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsync } from "./catchAsyncError";
import { AIWorker, ApiKey, User } from "@prisma/client";

export interface ApiKeyRequest extends Request {
  apiKey?: ApiKey,
  user: User,
  aiWorker: AIWorker
}

export const verifyApiKey = catchAsync(async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  const key = req.headers.authorization?.replace("Bearer ", "");
  if (!key) return next(new ErrorHandler("API key required", 401));

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: {
      user: true,
      aiWorker: true
    }
  });

  if (!apiKey) {
    return next(new ErrorHandler("Invalid API key", 403));
  }

  if (apiKey.remainingRuns <= 0) {
    return next(new ErrorHandler("API key has no remaining runs", 403));
  }

  req.apiKey = apiKey; // You may need to extend the Request type to include `apiKey`
  next();
});
