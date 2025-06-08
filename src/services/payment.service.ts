import crypto from "crypto";
import { razorpay } from "../config/razorpay";

export const createRazorpayOrder = async (amount: number) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });
  return order;
};

export const verifySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
};
