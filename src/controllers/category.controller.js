/**
 * ========================================
 * CATEGORY CONTROLLER - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Validation renforcée
 * - Gestion des erreurs cohérente
 * - Prévention des cycles de hiérarchie
 * - Logging amélioré
 * - Vérifications de dépendances
 */

import prisma from "../prisma.js";

/**
 * Vérifier si créer/modifier une catégorie créerait un cycle
 */
const wouldCreateCycle = async (categoryId, newParentId) => {
  if (!newParentId) return false;
  if (categoryId === newParentId) return true;

  let currentParentId = newParentId;
  const visited = new Set([categoryId]);

  while (currentParentId) {
    if (visited.has(currentParentId)) return true;
    visited.add(currentParentId);

    const parent = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentID: true }
    });

    if (!parent) break;
    currentParentId = parent.parentID;
  }

  return false;
};

/**
 * Récupérer toutes les catégories avec sous-catégories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentID: null }, // Récupère uniquement les catégories principales
      include: {
        children: {
          include: { 
            children: true, 
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                quantity: true
              }
            }
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true
          }
        },
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(categories);

  } catch (error) {
    console.error('❌ Erreur récupération catégories:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des catégories" 
    });
  }
};

/**
 * Récupérer une catégorie par ID avec enfants
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: {
          include: {
            _count: {
              select: {
                products: true,
                children: true
              }
            }
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            price: true
          }
        },
        parent: true,
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ 
        error: "Catégorie non trouvée" 
      });
    }

    res.json(category);

  } catch (error) {
    console.error('❌ Erreur récupération catégorie:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération de la catégorie" 
    });
  }
};

/**
 * Créer une catégorie (avec option parent)
 */
const createCategory = async (req, res) => {
  try {
    const { name, parentID } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: "Le nom de la catégorie est requis" 
      });
    }

    // Vérifier que le parent existe si fourni
    if (parentID) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parseInt(parentID) }
      });

      if (!parentExists) {
        return res.status(404).json({ 
          error: "Catégorie parente non trouvée" 
        });
      }
    }

    // Vérifier l'unicité du nom au même niveau
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        parentID: parentID ? parseInt(parentID) : null
      }
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: "Une catégorie avec ce nom existe déjà à ce niveau" 
      });
    }

    // Créer la catégorie
    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        parentID: parentID ? parseInt(parentID) : null
      },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      }
    });

    console.log(`✅ Catégorie créée: ${newCategory.name}`);

    res.status(201).json(newCategory);

  } catch (error) {
    console.error('❌ Erreur création catégorie:', error);
    res.status(500).json({ 
      error: "Erreur lors de la création de la catégorie" 
    });
  }
};

/**
 * Mettre à jour une catégorie
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentID } = req.body;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Vérifier que la catégorie existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ 
        error: "Catégorie non trouvée" 
      });
    }

    // Validation du nom
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ 
        error: "Le nom de la catégorie ne peut pas être vide" 
      });
    }

    // Vérifier le parent si fourni
    if (parentID !== undefined) {
      const parsedParentID = parentID ? parseInt(parentID) : null;

      // Empêcher une catégorie d'être son propre parent
      if (parsedParentID === parseInt(id)) {
        return res.status(400).json({ 
          error: "Une catégorie ne peut pas être son propre parent" 
        });
      }

      // Vérifier que le parent existe
      if (parsedParentID !== null) {
        const parentExists = await prisma.category.findUnique({
          where: { id: parsedParentID }
        });

        if (!parentExists) {
          return res.status(404).json({ 
            error: "Catégorie parente non trouvée" 
          });
        }

        // Vérifier qu'on ne crée pas de cycle
        const cycle = await wouldCreateCycle(parseInt(id), parsedParentID);
        if (cycle) {
          return res.status(400).json({ 
            error: "Cette modification créerait une hiérarchie circulaire" 
          });
        }
      }
    }

    // Vérifier l'unicité du nom si modifié
    if (name !== undefined) {
      const duplicateName = await prisma.category.findFirst({
        where: {
          name: name.trim(),
          parentID: parentID !== undefined 
            ? (parentID ? parseInt(parentID) : null)
            : existingCategory.parentID,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicateName) {
        return res.status(400).json({ 
          error: "Une catégorie avec ce nom existe déjà à ce niveau" 
        });
      }
    }

    // Mettre à jour la catégorie
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentID !== undefined) updateData.parentID = parentID ? parseInt(parentID) : null;

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      }
    });

    console.log(`✅ Catégorie mise à jour: ${updatedCategory.name}`);

    res.json(updatedCategory);

  } catch (error) {
    console.error('❌ Erreur mise à jour catégorie:', error);
    res.status(500).json({ 
      error: "Erreur lors de la mise à jour de la catégorie" 
    });
  }
};

/**
 * Supprimer une catégorie
 */
const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validation de l'ID
    if (isNaN(id)) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ 
        error: "Catégorie non trouvée" 
      });
    }

    // Vérifier qu'il n'y a pas de sous-catégories
    if (category._count.children > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer: cette catégorie contient ${category._count.children} sous-catégorie(s)` 
      });
    }

    // Vérifier qu'il n'y a pas de produits
    if (category._count.products > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer: cette catégorie contient ${category._count.products} produit(s)` 
      });
    }

    // Supprimer la catégorie
    await prisma.category.delete({
      where: { id }
    });

    console.log(`✅ Catégorie supprimée: ${category.name}`);

    res.json({ 
      message: "Catégorie supprimée avec succès" 
    });

  } catch (error) {
    console.error('❌ Erreur suppression catégorie:', error);
    res.status(500).json({ 
      error: "Erreur lors de la suppression de la catégorie" 
    });
  }
};

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};