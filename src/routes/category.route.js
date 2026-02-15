/**
 * CATEGORY ROUTES - ADMIN UNIQUEMENT
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireRole.js";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/category.controller.js";

const router = Router();

// Routes publiques
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Routes ADMIN UNIQUEMENT
router.post("/", auth, requireAdmin, createCategory);
router.put("/:id", auth, requireAdmin, updateCategory);
router.delete("/:id", auth, requireAdmin, deleteCategory);

export default router;