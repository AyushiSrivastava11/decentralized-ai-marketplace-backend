import { Request, Response, NextFunction } from "express";
import {
  createRazorpayOrder,
  verifySignature,
} from "../services/payment.service";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsync } from "../middlewares/catchAsyncError";
import prisma from "../database/prismaClient";
import { generateInvoicePDF } from "../utils/invoice";

// export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   try{
//     const { amount } = req.body;
//     const order = await createRazorpayOrder(amount);
//     return res.json(order);
//   }catch(error){
//     return next(new ErrorHandler("Failed to create order", 500));
//   }
// });

export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try{
  const { aiWorkerId, cycles } = req.body;

  const aiWorker = await prisma.aIWorker.findUnique({ where: { id: aiWorkerId } });
  if (!aiWorker) return next(new ErrorHandler("AI Agent not found", 404));

  const amount = aiWorker.pricePerRun * cycles;

  const order = await createRazorpayOrder(amount);

  return res.json({
    order,
    amount,
    aiWorkerName: aiWorker.name,
  });
}catch (error) {
  console.error("Error creating order:", error);
  return next(new ErrorHandler("Failed to create order", 500));
}
});

// export const verifyPayment = catchAsync(
//   (req: Request, res: Response, next: NextFunction) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body;
//     try {
//       const isValid = verifySignature(
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature
//       );
//       if (isValid) {
//         return res.json({ success: true });
//       } else {
//         res.status(400).json({ success: false });
//         return next(new ErrorHandler("Invalid payment signature", 400));
//       }
//     } catch (error) {
//       return next(new ErrorHandler("Payment verification failed", 500));
//     }
//   }
// );

// controllers/payment.controller.ts
export const verifyPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      aiWorkerId,
      cycles,
    } = req.body;

    const isValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) return next(new ErrorHandler("Invalid payment", 400));

    const aiWorker = await prisma.aIWorker.findUnique({ where: { id: aiWorkerId } });

    const order = await prisma.order.create({
      data: {
        userId,
        aiWorkerId,
        cycles,
        totalAmount: aiWorker!.pricePerRun * cycles,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "PAID",
      },
    });

    const invoicePath = await generateInvoicePDF(order);

    res.json({
      success: true,
      invoice: `${process.env.API_BASE_URL}/invoices/${invoicePath}`,
    });
  }
);
