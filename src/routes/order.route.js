/**
 * ORDER ROUTES
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireRole.js"; // 
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  confirmOrder,
  rejectOrder,
  getNotifications
} from "../controllers/order.controller.js";

const router = Router();

// Routes authentifiées
router.get("/", auth, getOrders);
router.get("/notifications", auth, getNotifications);
router.get("/:id", auth, getOrderById);

// Routes ADMIN UNIQUEMENT
router.post("/", auth, requireAdmin, createOrder);
router.put("/:id", auth, requireAdmin, updateOrder);
router.delete("/:id", auth, requireAdmin, deleteOrder);

// Routes publiques - Confirmation via email
router.get("/:id/confirm", confirmOrder);
router.get("/:id/reject", rejectOrder);

export default router;