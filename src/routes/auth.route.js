/**
 * ========================================
 * AUTH ROUTES - VERSION AMÉLIORÉE
 * ========================================
 */

import { Router } from "express";
import { 
  login, 
  getCurrentUser, 
  logout, 
  refreshToken 
} from "../controllers/auth.controller.js";
import auth from "../middleware/auth.js";

const router = Router();

// Route publique - Connexion
router.post("/login", login);

// Routes protégées - Nécessitent authentification
router.get("/me", auth, getCurrentUser);           // Obtenir l'utilisateur connecté
router.post("/logout", auth, logout);              // Déconnexion
router.post("/refresh", auth, refreshToken);       // Rafraîchir le token

export default router;