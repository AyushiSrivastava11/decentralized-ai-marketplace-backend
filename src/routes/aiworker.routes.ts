import express from 'express';
import { uploadWorker, executeWorker } from "../controllers/aiworker.controller";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), asyncHandler(uploadWorker)); 
router.post("/run/:id",asyncHandler(executeWorker));

export default router;