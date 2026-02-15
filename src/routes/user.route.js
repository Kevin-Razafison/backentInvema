/**
 * USER ROUTES 
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin, requireOwnerOrAdmin } from "../middleware/requireRole.js";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/user.controller.js";

const router = Router();

// Routes ADMIN UNIQUEMENT
router.post("/", auth, requireAdmin, createUser);
router.delete("/:id", auth, requireAdmin, deleteUser);

// Routes authentifiées
router.get("/", auth, getUsers);
router.get("/:id", auth, getUserById);
router.put("/:id", auth, requireOwnerOrAdmin, updateUser);

export default router;