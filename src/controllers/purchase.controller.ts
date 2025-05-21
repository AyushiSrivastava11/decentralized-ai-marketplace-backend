import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import { User } from '@prisma/client';
import { catchAsync } from '../middlewares/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';

interface UserRequest extends Request {
  user: User;
}

export const purchaseAIWorker = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new ErrorHandler('Unauthorized', 401));
    }

    const { aiWorkerId } = req.body;
    if (!aiWorkerId) {
      return next(new ErrorHandler('AI Worker ID is required', 400));
    }

    const aiWorker = await prisma.aIWorker.findUnique({
      where: { id: aiWorkerId },
    });

    if (!aiWorker || aiWorker.status !== 'APPROVED') {
      return next(new ErrorHandler('AI Worker not found or not approved', 404));
    }

    const existingPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId,
        aiWorkerId,
        status: 'PAID',
      },
    });

    if (existingPurchase) {
      return next(new ErrorHandler('You already own this AI Worker', 400));
    }

    const purchase = await prisma.userPurchase.create({
      data: {
        userId,
        aiWorkerId,
        status: 'PENDING',
      },
    });

    // TODO: Integrate payment gateway here, generate payment link or process payment


    // Simulate immediate payment success
    const paidPurchase = await prisma.userPurchase.update({
      where: { id: purchase.id },
      data: { status: 'PAID' },
    });

    res.json({
      success: true,
      message: 'AI Worker purchased successfully',
      purchaseId: paidPurchase.id,
    });
  }
);



/** 
 * 
 * 
 * 
 * import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const purchaseAIWorker = async (req: PurchaseRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { aiWorkerId } = req.body;
    if (!aiWorkerId)
      return res.status(400).json({ message: "AI Worker ID is required" });

    // Check AI Worker exists and is approved
    const aiWorker = await prisma.aIWorker.findUnique({
      where: { id: aiWorkerId },
    });
    if (!aiWorker || aiWorker.status !== "APPROVED") {
      return res
        .status(404)
        .json({ message: "AI Worker not found or not approved" });
    }

    // Check if user already purchased
    const existingPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId,
        aiWorkerId,
        status: "PAID",
      },
    });
    if (existingPurchase) {
      return res
        .status(400)
        .json({ message: "You already own this AI Worker" });
    }
-------------------------
    // Create a purchase record with status pending
    const purchase = await prisma.userPurchase.create({
      data: {
        userId,
        aiWorkerId,
        status: "PENDING",
      },
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(aiWorker.pricePerRun * 100), // amount in paise
      currency: "INR",
      receipt: purchase.id,
      payment_capture: 1, // automatic capture
    };

    const order = await razorpay.orders.create(options);

    // Send order details and purchaseId to frontend
    res.json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      purchaseId: purchase.id,
      amount: options.amount,
      currency: options.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Purchase failed", error: error.message });
  }
};






------------------------------------------------------------------


export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId } =
    req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generatedSignature === razorpay_signature) {
    // Signature is valid, update purchase to PAID
    await prisma.userPurchase.update({
      where: { id: purchaseId },
      data: { status: "PAID" },
    });
    return res.json({ success: true, message: "Payment verified" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
};



 */