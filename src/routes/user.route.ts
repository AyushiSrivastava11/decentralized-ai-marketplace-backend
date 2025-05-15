import { Router } from "express";
import {
  deleteMyProfile,
  getMyProfile,
  updateMyProfile,
} from "../controllers/user.controller"
import {authenticate, authorize} from "../auth/auth.middleware";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.delete("/delete", authenticate, deleteMyProfile);

export default router;
