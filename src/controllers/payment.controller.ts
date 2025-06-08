import { Request, Response, NextFunction } from "express";
import {
  createRazorpayOrder,
  verifySignature,
} from "../services/payment.service";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsync } from "../middlewares/catchAsyncError";

export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try{
    const { amount } = req.body;
    const order = await createRazorpayOrder(amount);
    return res.json(order);
  }catch(error){
    return next(new ErrorHandler("Failed to create order", 500));
  }
});

export const verifyPayment = catchAsync(
  (req: Request, res: Response, next: NextFunction) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    try {
      const isValid = verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      if (isValid) {
        return res.json({ success: true });
      } else {
        res.status(400).json({ success: false });
        return next(new ErrorHandler("Invalid payment signature", 400));
      }
    } catch (error) {
      return next(new ErrorHandler("Payment verification failed", 500));
    }
  }
);
