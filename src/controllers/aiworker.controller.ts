import { NextFunction, Request, Response } from "express";
import prisma from "../database/prismaClient";
import { deleteFromGCS, uploadToGCS } from "../services/gcs.service";
import { runAIWorker } from "../services/ai-executor.service";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { User } from "@prisma/client";
import { ApiKeyRequest } from "../middlewares/verifyApiKey";

interface UserRequest extends Request {
  user: User;
}

export const aiWorkerSelectFields = {
  id: true,
  name: true,
  description: true,
  tags: true,
  filePath: true,
  inputSchema: true,
  outputSchema: true,
  developerId: true,
  pricePerRun: true,
  status: true,
};

const extractFileName = (filePath: string): string | null => {
  const match = filePath.match(/\/agents\/(.+)\.zip$/);
  return match ? match[1] : null;
};

export const uploadWorker = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        tags,
        inputSchema,
        outputSchema,
        pricePerRun,
      } = req.body;
      console.log(req.user);
      const developerId = req.user.id;
      const file = req.file;

      const user = await prisma.user.findUnique({
        where: { id: developerId },
      });

      if (!user?.isDeveloper) {
        return next(
          new ErrorHandler("You are not authorized to upload AI Workers", 403)
        );
      }
      if (!name || !description || !tags || !pricePerRun) {
        return next(new ErrorHandler("Please fill all the fields", 400));
      }

      let parsedInputSchema, parsedOutputSchema;
      if (inputSchema && outputSchema) {
        try {
          parsedInputSchema = JSON.parse(inputSchema);
          parsedOutputSchema = JSON.parse(outputSchema);
        } catch (error) {
          return next(
            new ErrorHandler("Invalid JSON format for input/output schema", 400)
          );
        }
      }

      if (!file) {
        // return res.status(400).json({ success: false, message: "No file uploaded" });
        return next(new ErrorHandler("No file uploaded", 400));
      }
      console.log("File uploaded:", file.filename);

      const gcsUrl = await uploadToGCS(
        file.path,
        `agents/${file.filename}.zip`
      );

      const aiWorker = await prisma.aIWorker.create({
        data: {
          name,
          description,
          tags: tags.split(",").map((tag: string) => tag.trim()),
          filePath: gcsUrl,
          inputSchema: parsedInputSchema,
          outputSchema: parsedOutputSchema,
          developerId,
          pricePerRun: parseFloat(pricePerRun),
          status: "PENDING",
        },
      });

      res.json({ success: true, aiWorker });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const executeWorker = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { input } = req.body;
      const aiWorker = await prisma.aIWorker.findUnique({
        where: { id },
        select: { filePath: true },
      });
      if (!aiWorker || !aiWorker.filePath) {
        return next(new ErrorHandler("AI Worker file not found", 404));
      }

      const path = extractFileName(aiWorker.filePath);
      if (!path) {
        return next(new ErrorHandler("Invalid AI Worker file path", 400));
      }
      // const purchase = await prisma.userPurchase.findUnique({
      //   where: {
      //     userId_aiWorkerId: {
      //       userId,
      //       aiWorkerId: id,
      //     },
      //   },
      // });

      // if (!purchase || purchase.status !== "PAID") {
      //   return next(new ErrorHandler("You have not purchased access to this AI worker.", 403));
      // }
      const activeOrder = await prisma.order.findFirst({
        where: {
          userId,
          aiWorkerId: id,
          status: "PAID",
          cycles: { gt: 0 },
        },
      });

      if (!activeOrder) {
        return next(
          new ErrorHandler(
            "No remaining execution cycles. Please purchase more.",
            403
          )
        );
      }

      const job = await prisma.job.create({
        data: {
          input,
          aiWorkerId: id,
          status: "PENDING",
          userId,
        },
      });

      const result = await runAIWorker(id, input, job.id, path);
      if (!result) {
        return next(new ErrorHandler("Failed to execute AI Worker", 500));
      }
      await prisma.order.updateMany({
        where: {
          userId,
          aiWorkerId: id,
          status: "PAID",
          cycles: { gt: 0 },
        },
        data: {
          cycles: {
            decrement: 1,
          },
        },
      });

      res.json(result);
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//Get Approved AI Workers
export const approvedAIWorkers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aiApprovedWorkers = await prisma.aIWorker.findMany({
        where: {
          status: "APPROVED",
          // isPublic: true,
        },
        select: aiWorkerSelectFields,
      });

      if (aiApprovedWorkers.length === 0) {
        // return next(new ErrorHandler("No approved AI Workers found", 404));
        return res.json({ success: true, aiApprovedWorkers: [] });
      }
      res.json({ success: true, aiApprovedWorkers });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//execution by api and key
export const executionInMyCode = catchAsync(
  async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    const apiKey = req.apiKey; // comes from verifyApiKey
    const { input } = req.body;

    const aiWorkerId = req.params.workerId;
    const aiWorker = await prisma.aIWorker.findUnique({
      where: { id: aiWorkerId },
      select: { filePath: true },
    });

    if (!aiWorker || !aiWorker.filePath) {
      return next(new ErrorHandler("AI Worker file not found", 404));
    }

    const path = extractFileName(aiWorker.filePath);
    if (!path) {
      return next(new ErrorHandler("Invalid AI Worker file path", 400));
    }

    if (!apiKey) {
      return next(new ErrorHandler("API key missing", 401));
    }

    if (apiKey.aiWorkerId !== aiWorkerId) {
      return next(new ErrorHandler("API key doesn't match this worker.", 403));
    }
    if (apiKey.remainingRuns <= 0) {
      return next(new ErrorHandler("No remaining runs for this API key.", 403));
    }
    const job = await prisma.job.create({
      data: {
        input,
        aiWorkerId,
        userId: apiKey.userId,
        status: "PENDING",
      },
    });

    const result = await runAIWorker(aiWorkerId, input, job.id, path);

    await prisma.order.updateMany({
      where: {
        userId: apiKey.userId,
        aiWorkerId,
        status: "PAID",
        cycles: { gt: 0 },
      },
      data: {
        cycles: {
          decrement: 1,
        },
      },
    });

    await prisma.apiKey.update({
      where: { key: apiKey.key },
      data: {
        remainingRuns: {
          decrement: 1,
        },
      },
    });

    res.json({ success: true, output: result });
  }
);

//Unchecked

export const getMyPurchasedAIWorkers = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.user.id; // Assuming you get the userId from the request params

      const userWithPurchasedWorkers = await prisma.user.findUnique({
        where: {
          id: id,
        },
        include: {
          purchases: true,
        },
      });

      if (
        !userWithPurchasedWorkers ||
        userWithPurchasedWorkers.purchases.length === 0
      ) {
        return next(new ErrorHandler("No purchased AI Workers found", 404));
      }
      res.json({ success: true, userWithPurchasedWorkers });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
