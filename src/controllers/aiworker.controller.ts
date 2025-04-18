import { NextFunction, Request, Response } from "express";
import prisma from "@/src/database/prismaClient";
import { uploadToGCS } from "@/src/services/gcs.service";
import { runAIWorker } from "@/src/services/ai-executor.service";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

export const uploadWorker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        tags,
        inputSchema,
        outputSchema,
        pricePerRun,
      } = req.body;
      const file = req.file;

      if (!file) {
        // return res.status(400).json({ success: false, message: "No file uploaded" });
        return next(new ErrorHandler("No file uploaded", 400));
      }

      const gcsUrl = await uploadToGCS(file.path, `agents/${file.filename}`);

      const aiWorker = await prisma.aIWorker.create({
        data: {
          name,
          description,
          tags: tags.split(","),
          filePath: gcsUrl,
          inputSchema: JSON.parse(inputSchema),
          outputSchema: JSON.parse(outputSchema),
          developerId: "user-id",
          pricePerRun: parseFloat(pricePerRun),
        },
      });

      res.json({ success: true, aiWorker });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const executeWorker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    /*const { workerId, input } = req.body;

  if (!workerId || !input) {
    return res.status(400).json({ success: false, message: "workerId and input are required" });
  }

  const aiWorker = await prisma.aIWorker.findUnique({
    where: { id: workerId },
  });

  if (!aiWorker) {
    return res.status(404).json({ success: false, message: "AI Worker not found" });
  }

  const output = { result: "Dummy output from AI Worker" };

  res.json({ success: true, output });*/

    try {
      const { id } = req.params;
      const { input, userId } = req.body;

      const job = await prisma.job.create({
        data: {
          input,
          aiWorkerId: id,
          status: "PENDING",
          userId,
        },
      });

      const result = await runAIWorker(id, input, userId);
      res.json(result);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
