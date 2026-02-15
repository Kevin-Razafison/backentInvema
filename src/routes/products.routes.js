/**
 * PRODUCTS ROUTES 
 */

import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireRole.js"; 
import { 
  getProducts, 
  createProduct, 
  modifyProduct, 
  deleteProduct, 
  upload 
} from "../controllers/products.controller.js";

const router = Router();

// Route publique
router.get("/", getProducts);

// Routes ADMIN UNIQUEMENT (plus de requireMagasinier)
router.post("/", auth, requireAdmin, upload.single("imageUrl"), createProduct);
router.put("/:id", auth, requireAdmin, upload.single("imageUrl"), modifyProduct);
router.delete("/:id", auth, requireAdmin, deleteProduct);

export default router;