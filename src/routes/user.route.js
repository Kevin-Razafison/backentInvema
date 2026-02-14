/**
 * ========================================
 * USER ROUTES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Sécurité:
 * - Toutes les routes nécessitent authentification
 * - Création/suppression réservées aux admins
 * - Utilisateurs peuvent voir leur propre profil
 * - Mise à jour nécessite être propriétaire ou admin
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

// Routes admin uniquement
router.post("/", auth, requireAdmin, createUser);           // Créer utilisateur (admin uniquement)
router.delete("/:id", auth, requireAdmin, deleteUser);      // Supprimer utilisateur (admin uniquement)

// Routes authentifiées
router.get("/", auth, getUsers);                            // Lister tous les utilisateurs
router.get("/:id", auth, getUserById);                      // Voir un utilisateur
router.put("/:id", auth, requireOwnerOrAdmin(), updateUser); // Modifier (propriétaire ou admin)

export default router;