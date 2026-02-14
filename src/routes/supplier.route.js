/**
 * ========================================
 * SUPPLIER ROUTES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Sécurité:
 * - Lecture publique ou authentifiée selon vos besoins
 * - Création/modification/suppression réservées aux admins
 * - Upload d'images via Cloudinary
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

// Routes publiques (ou ajoutez auth si nécessaire)
router.get("/", getSuppliers);                                    // Lister fournisseurs
router.get("/:id", getSupplierById);                              // Voir un fournisseur

// Routes admin avec upload Cloudinary
router.post("/", auth, requireAdmin, upload.single("image"), createSupplier);     // Créer avec image
router.put("/:id", auth, requireAdmin, upload.single("image"), updateSupplier);   // Modifier (avec ou sans nouvelle image)
router.delete("/:id", auth, requireAdmin, deleteSupplier);                        // Supprimer

export default router;