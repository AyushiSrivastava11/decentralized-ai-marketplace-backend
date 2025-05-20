import { NextFunction, Request, Response } from "express";
import prisma from "../database/prismaClient";
import { deleteFromGCS, uploadToGCS } from "../services/gcs.service";
import { runAIWorker } from "../services/ai-executor.service";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { User } from "@prisma/client";

interface UserRequest extends Request {
  user: User;
}

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

      const gcsUrl = await uploadToGCS(
        file.path,
        `agents/${file.filename}.zip`
      );

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

export const deleteRejectedWorkers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rejectedWorkers = await prisma.aIWorker.findMany({
        where: { status: "REJECTED" },
      });

      if (rejectedWorkers.length === 0) {
        return res.json({ success: true, message: "No rejected AI workers found" });
      }

      for (const worker of rejectedWorkers) {
        try {
          await deleteFromGCS(worker.filePath);
          await prisma.aIWorker.delete({ where: { id: worker.id } });
        } catch (err: any) {
          console.error(`Failed to delete worker ${worker.id}:`, err.message);
        }
      }

      res.json({
        success: true,
        message: `Deleted ${rejectedWorkers.length} rejected AI worker(s)`,
      });
    } catch (error: any) {
      console.error("Error deleting rejected workers:", error);
      return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
  }
);

//Get Approved AI Workers
export const approveAIWorkers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aiApprovedWorkers = await prisma.aIWorker.findMany({
        where: {
          status: "APPROVED",
        },
        select: {
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
        },
      });

      if (!aiApprovedWorkers) {
        return next(new ErrorHandler("No approved AI Workers found", 404));
      }
      res.json({ success: true, aiApprovedWorkers });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getMyPurchasedAIWorkers = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.user.id; // Assuming you get the userId from the request params

      const userWithPurchasedWorkers = await prisma.user.findMany({
        where: {
          id: id,
        },
        include: {
          purchasedAIWorkers: true,
        },
      });

      if (!userWithPurchasedWorkers) {
        return next(new ErrorHandler("No purchased AI Workers found", 404));
      }

      res.json({ success: true, userWithPurchasedWorkers });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//Get All AI Workers
export const getsAllAIWorkers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allAIWorkers = await prisma.aIWorker.findMany({
        select: {
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
        },
      });
      if (!allAIWorkers) {
        return next(new ErrorHandler("No AI Workers found", 404));
      }
      res.json({ success: true, allAIWorkers });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getAIWorkerById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // For AI Worker ID
      const aiWorker = await prisma.aIWorker.findUnique({
        where: {
          id,
        },
        select: {
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
        },
      });
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

