/**
 * ========================================
 * PRODUCTS ROUTES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Sécurité:
 * - Lecture publique ou authentifiée selon vos besoins
 * - Création/modification/suppression réservées aux admins ou magasiniers
 * - Upload d'images via Cloudinary
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireMagasinier } from "../middleware/requireRole.js";
import { 
  getProducts, 
  createProduct, 
  modifyProduct, 
  deleteProduct, 
  upload 
} from "../controllers/products.controller.js";

const router = Router();

// Route publique (ou ajoutez auth si nécessaire)
router.get("/", getProducts);                                                  // Lister produits

// Routes protégées - Admin ou Magasinier avec upload Cloudinary
router.post("/", auth, requireMagasinier, upload.single("imageUrl"), createProduct);    // Créer produit
router.put("/:id", auth, requireMagasinier, upload.single("imageUrl"), modifyProduct);  // Modifier produit
router.delete("/:id", auth, requireMagasinier, deleteProduct);                          // Supprimer produit

export default router;