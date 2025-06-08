import { Router } from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

export default router;
