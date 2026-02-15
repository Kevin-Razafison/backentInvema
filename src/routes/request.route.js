/**
 * REQUEST ROUTES - CORRIGÉ
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireRole.js";
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  updateRequest,
  deleteRequest,
  getRequestStats
} from "../controllers/request.controller.js";

const router = Router();

// Routes authentifiées - Accessibles à tous
router.post("/", auth, createRequest);              
router.get("/", auth, getRequests);
router.get("/stats", auth, getRequestStats);
router.get("/:id", auth, getRequestById);

// Routes ADMIN UNIQUEMENT
router.put("/:id/status", auth, requireAdmin, updateRequestStatus);
router.put("/:id", auth, requireAdmin, updateRequest);
router.delete("/:id", auth, requireAdmin, deleteRequest);

export default router;