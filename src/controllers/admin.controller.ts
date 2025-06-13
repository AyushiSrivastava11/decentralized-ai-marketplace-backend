import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import prisma from "../database/prismaClient";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { aiWorkerSelectFields } from "./aiworker.controller";
import { deleteFromGCS } from "../services/gcs.service";

export interface UserRequest extends Request {
  user: User;
}

//Get Pending
export const getPendingWorkers = catchAsync(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workers = await prisma.aIWorker.findMany({
        where: { status: "PENDING" },
      });

      return res.json(workers);
    } catch (error: any) {
      console.error("Error fetching pending workers:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Updated Status
export const approveWorker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.aIWorker.update({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", isPublic: true, rejectionReason: null },
      });
      return res.json({ message: "Worker approved" });
    } catch (error: any) {
      console.error("Error approving worker:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const rejectWorker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason)
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });

      await prisma.aIWorker.update({
        where: { id, status: "PENDING" },
        data: { status: "REJECTED", rejectionReason: reason },
      });
      return res.json({ message: "Worker rejected" });
    } catch (error: any) {
      console.error("Error rejecting worker:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get Users
export const getAllUsers = catchAsync(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          isDeveloper: true,
          role: true,
        },
      });
      return res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get All AI Workers for Admin
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

//Get AI Worker by ID for Admin
export const getAIWorkerById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // For AI Worker ID
      const aiWorker = await prisma.aIWorker.findUnique({
        where: {
          id,
        },
        select: aiWorkerSelectFields,
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

//Unchecked
export const deleteRejectedWorkers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rejectedWorkers = await prisma.aIWorker.findMany({
        where: { status: "REJECTED" },
      });

      if (rejectedWorkers.length === 0) {
        return res.json({
          success: true,
          message: "No rejected AI workers found",
        });
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
      return next(
        new ErrorHandler(error.message || "Internal Server Error", 500)
      );
    }
  }
);
