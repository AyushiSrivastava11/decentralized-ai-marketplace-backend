import { Response } from "express";
import prisma from "../database/prismaClient";
import { catchAsync } from "../middlewares/catchAsyncError";
import { ApiKeyRequest } from "../middlewares/verifyApiKey";

// POST /api-key/generate
export const generateApiKey = catchAsync(async (req: ApiKeyRequest, res: Response) => {
  const { userId, aiWorkerId, runs } = req.body;

  const newKey = crypto.randomUUID(); // or use `nanoid()` if you're using it

  const apiKey = await prisma.apiKey.create({
    data: {
      key: newKey,
      userId,
      aiWorkerId,
      remainingRuns: runs ?? 10,
    },
  });

    res.status(201).json({
        success: true,
        message: "API Key generated successfully",
        data: {
        apiKey: apiKey.key,
        remainingRuns: apiKey.remainingRuns,
        },
    });
});
