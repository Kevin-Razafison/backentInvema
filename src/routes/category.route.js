import { Router } from "express";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
}  from "../controllers/category.controller.js";

import {requireRole} from "../middleware/requireRole.js"

const router = Router();
//Récupérer toutes les catégories principales (avec sous-catégories)
router.get("/",getCategories);

//Récupérer une catégorie par ID (avec enfants et parent)
router.get("/:id", getCategoryById);

//Créer une nouvelle catégorie ou sous-catégorie
router.post("/", createCategory)

//Mettre à jour une catégorie ou sous catégorie
router.put("/:id",updateCategory);

//supprimer une catégorie ou sous-catégorie
router.delete("/:id", requireRole('ADMIN'), deleteCategory);

export default router;