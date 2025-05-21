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

      if (!name || !description || !tags || !inputSchema || !outputSchema) {
        return next(new ErrorHandler("Please fill all the fields", 400));
      }

      let parsedInputSchema, parsedOutputSchema;
      try {
        parsedInputSchema = JSON.parse(inputSchema);
        parsedOutputSchema = JSON.parse(outputSchema);
      } catch (error) {
        return next(
          new ErrorHandler("Invalid JSON format for input/output schema", 400)
        );
      }

      // const parsedPrice = parseFloat(pricePerRun);
      // if (isNaN(parsedPrice) || parsedPrice <= 0) {
      //   return next(
      //     new ErrorHandler("Price per run must be a positive number", 400)
      //   );
      // }
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

//Get Approved AI Workers
export const approveAIWorkers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aiApprovedWorkers = await prisma.aIWorker.findMany({
        where: {
          status: "APPROVED",
        },
        select: aiWorkerSelectFields,
      });

      if (aiApprovedWorkers.length === 0) {
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

//Get all AI Workers for Users
export const getAllAIWorkersForUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allAIWorkers = await prisma.aIWorker.findMany({
        where: {
          status: "APPROVED",
        },
        select: aiWorkerSelectFields,
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

//Get AI Worker by ID for Users
export const getAIWorkerByIdForUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // For AI Worker ID
      const aiWorker = await prisma.aIWorker.findUnique({
        where: {
          id, status: "APPROVED",
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

//Rent AI Worker
// export const rentAIWorker = catchAsync(
//   async (req: UserRequest, res: Response, next: NextFunction) => {
//     try {
//       const { id } = req.params; // For AI Worker ID
//       const userId = req.user.id;

//       const aiWorker = await prisma.aIWorker.findUnique({
//         where: {
//           id,
//         },
//         select: aiWorkerSelectFields,
//       });
//       if (!aiWorker) {
//         return next(new ErrorHandler("AI Worker not found", 404));
//       }

//       const user = await prisma.user.findUnique({
//         where: {
//           id: userId,
//         },
//       });
//       if (!user) {
//         return next(new ErrorHandler("User not found", 404));
//       }

//       if (user.balance < aiWorker.pricePerRun) {
//         return next(
//           new ErrorHandler("Insufficient balance to rent this AI Worker", 400)
//         );
//       }

//       await prisma.user.update({
//         where: { id: userId },
//         data: { balance: user.balance - aiWorker.pricePerRun },
//       });

//       await prisma.aIWorker.update({
//         where: { id },
//         data: { status: "RENTED" },
//       });

//       res.json({ success: true, message: "AI Worker rented successfully" });
//     } catch (error: any) {
//       console.log(error);
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );