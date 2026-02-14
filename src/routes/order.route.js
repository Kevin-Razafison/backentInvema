/**
 * ========================================
 * ORDER ROUTES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Sécurité:
 * - Toutes les routes nécessitent authentification (sauf confirmation email)
 * - Création/modification/suppression réservées aux admins ou magasiniers
 * - Routes de confirmation/rejet sécurisées par token JWT
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireMagasinier } from "../middleware/requireRole.js";
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

// Routes authentifiées - Lecture
router.get("/", auth, getOrders);                                    // Lister commandes
router.get("/notifications", auth, getNotifications);                // Notifications récentes
router.get("/:id", auth, getOrderById);                              // Voir une commande

// Routes protégées - Admin ou Magasinier
router.post("/", auth, requireMagasinier, createOrder);              // Créer commande
router.put("/:id", auth, requireMagasinier, updateOrder);            // Modifier commande
router.delete("/:id", auth, requireMagasinier, deleteOrder);         // Supprimer commande

// Routes publiques - Confirmation via email (sécurisées par token dans l'URL)
router.get("/:id/confirm", confirmOrder);                            // Confirmer commande (fournisseur)
router.get("/:id/reject", rejectOrder);                              // Rejeter commande (fournisseur)

export default router;