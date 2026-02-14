/**
 * ========================================
 * CATEGORY ROUTES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Sécurité:
 * - Lecture publique (ou authentifiée selon vos besoins)
 * - Création/modification réservées aux admins ou magasiniers
 * - Suppression réservée aux admins uniquement
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin, requireMagasinier } from "../middleware/requireRole.js";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/category.controller.js";

const router = Router();

// Routes publiques (ou ajoutez auth si nécessaire)
router.get("/", getCategories);                                     // Lister catégories principales
router.get("/:id", getCategoryById);                                // Voir une catégorie

// Routes protégées - Admin ou Magasinier
router.post("/", auth, requireMagasinier, createCategory);          // Créer catégorie
router.put("/:id", auth, requireMagasinier, updateCategory);        // Modifier catégorie

// Route admin uniquement
router.delete("/:id", auth, requireAdmin, deleteCategory);          // Supprimer catégorie

export default router;