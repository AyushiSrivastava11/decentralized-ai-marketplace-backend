import { Router } from "express";
import {
  deleteMyProfile,
  getMyProfile,
  updateMyProfile,
  getAIWorkerByIdForUsers,
  checkPurchaseStatus,
} from "../controllers/user.controller";
import { authenticate, authorize } from "../auth/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.delete("/delete", deleteMyProfile);
router.get("/get-aiworker/:id", getAIWorkerByIdForUsers);
router.get("/:userId/purchased-workers/:agentId", checkPurchaseStatus);

export default router;
