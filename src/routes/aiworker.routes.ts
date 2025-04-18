import express from 'express';
import { uploadWorker, executeWorker } from "../controllers/aiworker.controller";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"),uploadWorker); 
router.post("/run/:id",executeWorker);

export default router;