import { Router } from "express";
import isAdmin from "../middleware/isAdmin.js";
import { requireRole } from "../middleware/requireRole.js";
import auth from "../middleware/auth.js";
const router = Router();

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/user.controller.js";

router.post("/", auth, isAdmin, requireRole("ADMIN"), createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;