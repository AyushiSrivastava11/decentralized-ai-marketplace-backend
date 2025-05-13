import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/user.controller"
import {authenticate, authorize} from "../auth/auth.middleware";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);

export default router;
