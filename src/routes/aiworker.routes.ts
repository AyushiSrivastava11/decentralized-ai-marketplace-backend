import express from "express";
import {
  uploadWorker,
  executeWorker,
  approvedAIWorkers,
  getMyPurchasedAIWorkers,
  executionInMyCode,
} from "../controllers/aiworker.controller";
import multer from "multer";
import { authenticate } from "../auth/auth.middleware";
import { verifyApiKey } from "../middlewares/verifyApiKey";
import { verifyPurchase } from "../middlewares/verifyPurchase";
import { generateApiKey } from "../services/generateapi.service";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticate);
router.post("/upload", upload.single("file"), uploadWorker);
router.post("/run/:id", verifyPurchase, executeWorker);
router.get("/get-approved-workers", approvedAIWorkers);
router.get("/get-my-purchased-workers", getMyPurchasedAIWorkers);
router.post("/api-key/generate", verifyPurchase, generateApiKey);
router.post("/external-execute/:workerId", verifyApiKey, executionInMyCode);
export default router;
