/**
 * ========================================
 * REQUEST ROUTES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Sécurité:
 * - Toutes les routes nécessitent authentification
 * - Employés peuvent créer des demandes
 * - Modification du statut réservée aux magasiniers/admins
 * - Suppression réservée aux admins
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireMagasinier, requireAdmin } from "../middleware/requireRole.js";
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

// Routes authentifiées - Accessibles à tous les employés
router.post("/", auth, createRequest);                               // Créer demande (tous)
router.get("/", auth, getRequests);                                  // Lister demandes (tous)
router.get("/stats", auth, getRequestStats);                         // Statistiques (tous)
router.get("/:id", auth, getRequestById);                            // Voir une demande (tous)

// Routes protégées - Admin ou Magasinier
router.put("/:id/status", auth, requireMagasinier, updateRequestStatus);  // Changer statut (magasinier/admin)
router.put("/:id", auth, requireMagasinier, updateRequest);               // Modifier demande (magasinier/admin)

// Route admin uniquement
router.delete("/:id", auth, requireAdmin, deleteRequest);                 // Supprimer demande (admin uniquement)

export default router;