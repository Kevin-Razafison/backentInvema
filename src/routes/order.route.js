import express from "express";
import {
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
  rejectOrder,
  getOrders,
  getNotifications
} from "../controllers/order.controller.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// Routes protégées par auth + rôle ADMIN
router.post("/", auth, requireRole("ADMIN"), createOrder);
router.put("/:id", auth, requireRole("ADMIN"), updateOrder);
router.delete("/:id", auth, requireRole("ADMIN"), deleteOrder);
router.get("/", auth, getOrders);
router.get("/notifications", auth, getNotifications);


// Routes email pour confirmer ou rejeter (sécurisées par token dans le lien)
router.get("/:id/confirm", confirmOrder);
router.get("/:id/reject", rejectOrder);

export default router;
