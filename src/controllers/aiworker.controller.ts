import { NextFunction, Request, Response } from "express";
import prisma from "../database/prismaClient";
import { uploadToGCS } from "../services/gcs.service";
import { runAIWorker } from "../services/ai-executor.service";
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
      console.log("File uploaded:", file.filename);

      const gcsUrl = await uploadToGCS(file.path, `agents/${file.filename}.zip`);

      const aiWorker = await prisma.aIWorker.create({
        data: {
          name,
          description,
          tags: tags.split(","),
          filePath: gcsUrl,
          inputSchema: JSON.parse(inputSchema),
          outputSchema: JSON.parse(outputSchema),
          developerId: "allahabibi",
          pricePerRun: parseFloat(pricePerRun),
        },
      });

      res.json({ success: true, aiWorker  });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const executeWorker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; //For AI Worker ID
      const { input, userId, path } = req.body;

      const job = await prisma.job.create({
        data: {
          input,
          aiWorkerId: id,
          status: "PENDING",
          userId,
        },
      });

      const result = await runAIWorker(id, input, job.id, path);
      res.json(result);
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
