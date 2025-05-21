import express from 'express';
import { uploadWorker, executeWorker, approvedAIWorkers, getMyPurchasedAIWorkers, getAIWorkerByIdForUsers } from "../controllers/aiworker.controller";
import multer from "multer";
import { authenticate } from '../auth/auth.middleware';

const router = express.Router();
const upload = multer({ dest: "uploads/" });


router.use(authenticate);
router.post("/upload", upload.single("file"),uploadWorker); 
router.post("/run/:id",executeWorker);
router.get("/get-approved-workers", approvedAIWorkers); //Get all approved ai workers is the get all ai workers for normal users
router.get("/get-my-purchased-workers", getMyPurchasedAIWorkers);
router.get("/get-aiworker/:id", getAIWorkerByIdForUsers); //Get AI Worker by ID for normal users
export default router;