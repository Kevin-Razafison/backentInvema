/**
 * SUPPLIER ROUTES - ADMIN UNIQUEMENT
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireRole.js";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  upload,
} from "../controllers/supplier.controller.js";

const router = Router();

// Routes publiques
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);

// Routes ADMIN UNIQUEMENT
router.post("/", auth, requireAdmin, upload.single("image"), createSupplier);
router.put("/:id", auth, requireAdmin, upload.single("image"), updateSupplier);
router.delete("/:id", auth, requireAdmin, deleteSupplier);

export default router;