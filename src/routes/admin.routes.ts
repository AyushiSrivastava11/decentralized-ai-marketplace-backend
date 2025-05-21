import express from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import { approveWorker, getAllUsers, getPendingWorkers, rejectWorker } from "../controllers/admin.controller";

const router = express.Router();

router.use(authenticate);
router.use(authorize(["ADMIN"]));

router.get("/get-pending-workers",getPendingWorkers);
router.patch("/approve-worker/:id", approveWorker);
router.patch("/reject-worker/:id", rejectWorker);
router.get("/get-all-users", getAllUsers);



export default router;