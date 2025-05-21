import express from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import { approveWorker, getAllUsers, getPendingWorkers, rejectWorker } from "../controllers/admin.controller";
import {getAIWorkerById, getsAllAIWorkers} from "../controllers/aiworker.controller";
const router = express.Router();

router.use(authenticate);
router.use(authorize(["ADMIN"]));

router.get("/get-pending-workers",getPendingWorkers);
router.patch("/approve-worker/:id", approveWorker);
router.patch("/reject-worker/:id", rejectWorker);
router.get("/get-all-users", getAllUsers);
router.get("/get-all-aiworkers", getsAllAIWorkers);
router.get("/get-aiworkers/:id", getAIWorkerById);

export default router;