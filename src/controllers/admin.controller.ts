import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import prisma from "../database/prismaClient";
import { catchAsync } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

export interface UserRequest extends Request {
  user: User;
}

//Get Pending
export const getPendingWorkers = catchAsync(async (_req: Request, res: Response, next:NextFunction) => {
 try{ const workers = await prisma.aIWorker.findMany({ where: { status: 'PENDING' } });
    if (!workers || workers.length === 0) {
        return next(new ErrorHandler("No pending workers found", 404));
    }
  return res.json(workers);
 }catch (error:any) {
    console.error("Error fetching pending workers:", error);
    return next(new ErrorHandler(error.message, 500));
 }
});

//Updated Status
export const approveWorker = catchAsync(async (req: Request, res: Response, next:NextFunction) => {
  try{const { id } = req.params;
  await prisma.aIWorker.update({
    where: { id, status: 'PENDING' },
    data: { status: 'APPROVED', rejectionReason: null },
  });
  return res.json({ message: 'Worker approved' });
  }catch (error:any) {
    console.error("Error approving worker:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

export const rejectWorker = catchAsync(async (req: Request, res: Response, next:NextFunction) => {
  try{const { id } = req.params;
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });

  await prisma.aIWorker.update({
    where: { id, status: 'PENDING' },
    data: { status: 'REJECTED', rejectionReason: reason },
  });
  return res.json({ message: 'Worker rejected' });
  }catch (error:any) {
    console.error("Error rejecting worker:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

//Get Users
export const getAllUsers = catchAsync(async (_req: Request, res: Response, next: NextFunction) => {
  try{const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, isDeveloper: true, role: true },
  });
  return res.json(users);
}catch (error:any) {
    console.error("Error fetching users:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});