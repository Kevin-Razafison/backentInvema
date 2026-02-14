/**
 * ========================================
 * REQUEST CONTROLLER - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Validation renforcée
 * - Gestion des erreurs cohérente
 * - Vérification de stock disponible
 * - Logging amélioré
 * - Gestion des statuts robuste
 */

import prisma from "../prisma.js";

/**
 * Créer une nouvelle demande
 */
const createRequest = async (req, res) => {
  try {
    const { quantity, reason, productId, userId } = req.body;

    // Validation des champs requis
    if (!quantity || !productId || !userId) {
      return res.status(400).json({ 
        error: "Les champs quantity, productId et userId sont requis" 
      });
    }

    // Validation de la quantité
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ 
        error: "La quantité doit être un nombre positif" 
      });
    }

    const parsedProductId = parseInt(productId);
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedProductId) || isNaN(parsedUserId)) {
      return res.status(400).json({ 
        error: "IDs invalides" 
      });
    }

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId }
    });

    if (!product) {
      return res.status(404).json({ 
        error: "Produit non trouvé" 
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }
    });

    if (!user) {
      return res.status(404).json({ 
        error: "Utilisateur non trouvé" 
      });
    }

    // Vérifier le stock disponible (avertissement si insuffisant)
    if (product.quantity < parsedQuantity) {
      console.warn(
        `⚠️ Stock insuffisant pour le produit ${product.name}. ` +
        `Demandé: ${parsedQuantity}, Disponible: ${product.quantity}`
      );
    }

    // Créer la demande
    const request = await prisma.request.create({
      data: {
        quantity: parsedQuantity,
        reason: reason?.trim() || null,
        productId: parsedProductId,
        userId: parsedUserId,
      },
      include: { 
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            imageUrl: true
          }
        }, 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
    });

    console.log(
      `✅ Demande créée: ${parsedQuantity}x ${product.name} ` +
      `par ${user.name}`
    );

    res.status(201).json(request);

  } catch (err) {
    console.error('❌ Erreur création demande:', err);
    res.status(500).json({ 
      error: "Impossible de créer la demande" 
    });
  }
};

/**
 * Lister toutes les demandes
 */
const getRequests = async (_req, res) => {
  try {
    const requests = await prisma.request.findMany({
      include: { 
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            imageUrl: true,
            price: true
          }
        }, 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);

  } catch (err) {
    console.error('❌ Erreur récupération demandes:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer les demandes" 
    });
  }
};

/**
 * Obtenir une demande par ID
 */
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    const request = await prisma.request.findUnique({
      where: { id: parseInt(id) },
      include: { 
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            imageUrl: true,
            price: true,
            alertLevel: true
          }
        }, 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
    });

    if (!request) {
      return res.status(404).json({ 
        error: "Demande non trouvée" 
      });
    }

    res.json(request);

  } catch (err) {
    console.error('❌ Erreur récupération demande:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer la demande" 
    });
  }
};

/**
 * Mettre à jour le statut d'une demande
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Validation du statut
    if (!status) {
      return res.status(400).json({ 
        error: "Le statut est requis" 
      });
    }

    const validStatuses = ["PENDING", "APPROVED", "REJECTER", "PREPARED", "PICKEDUP"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` 
      });
    }

    // Vérifier que la demande existe
    const existingRequest = await prisma.request.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        user: true
      }
    });

    if (!existingRequest) {
      return res.status(404).json({ 
        error: "Demande non trouvée" 
      });
    }

    // Si on approuve la demande, vérifier le stock
    if (status === "APPROVED") {
      if (existingRequest.product.quantity < existingRequest.quantity) {
        return res.status(400).json({ 
          error: `Stock insuffisant. Disponible: ${existingRequest.product.quantity}, Demandé: ${existingRequest.quantity}` 
        });
      }
    }

    // Si la demande est récupérée, déduire du stock
    if (status === "PICKEDUP" && existingRequest.status !== "PICKEDUP") {
      const newQuantity = Math.max(0, existingRequest.product.quantity - existingRequest.quantity);
      
      await prisma.product.update({
        where: { id: existingRequest.productId },
        data: { quantity: newQuantity }
      });

      console.log(
        `📦 Stock mis à jour pour ${existingRequest.product.name}: ` +
        `${existingRequest.product.quantity} → ${newQuantity}`
      );
    }

    // Mettre à jour le statut
    const updated = await prisma.request.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { 
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            imageUrl: true
          }
        }, 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
    });

    console.log(
      `✅ Demande #${id} mise à jour: ${existingRequest.status} → ${status}`
    );

    res.json(updated);

  } catch (err) {
    console.error('❌ Erreur mise à jour demande:', err);
    res.status(500).json({ 
      error: "Impossible de mettre à jour la demande" 
    });
  }
};

/**
 * Mettre à jour une demande (quantité, raison)
 */
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Vérifier que la demande existe
    const existingRequest = await prisma.request.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRequest) {
      return res.status(404).json({ 
        error: "Demande non trouvée" 
      });
    }

    // Ne permettre la modification que si la demande est en attente
    if (existingRequest.status !== "PENDING") {
      return res.status(400).json({ 
        error: "Seules les demandes en attente peuvent être modifiées" 
      });
    }

    const updateData = {};

    // Validation et ajout de la quantité
    if (quantity !== undefined) {
      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ 
          error: "La quantité doit être un nombre positif" 
        });
      }
      updateData.quantity = parsedQuantity;
    }

    if (reason !== undefined) {
      updateData.reason = reason?.trim() || null;
    }

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: "Aucun champ à mettre à jour" 
      });
    }

    // Mettre à jour
    const updated = await prisma.request.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { 
        product: true, 
        user: true 
      },
    });

    console.log(`✅ Demande #${id} modifiée`);

    res.json(updated);

  } catch (err) {
    console.error('❌ Erreur modification demande:', err);
    res.status(500).json({ 
      error: "Impossible de modifier la demande" 
    });
  }
};

/**
 * Supprimer une demande
 */
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Vérifier que la demande existe
    const existingRequest = await prisma.request.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRequest) {
      return res.status(404).json({ 
        error: "Demande non trouvée" 
      });
    }

    // Empêcher la suppression si la demande a déjà été traitée
    if (["PREPARED", "PICKEDUP"].includes(existingRequest.status)) {
      return res.status(400).json({ 
        error: "Impossible de supprimer une demande déjà traitée" 
      });
    }

    // Supprimer la demande
    await prisma.request.delete({ 
      where: { id: parseInt(id) } 
    });

    console.log(`✅ Demande #${id} supprimée`);

    res.json({ 
      message: "Demande supprimée avec succès" 
    });

  } catch (err) {
    console.error('❌ Erreur suppression demande:', err);
    res.status(500).json({ 
      error: "Impossible de supprimer la demande" 
    });
  }
};

/**
 * Obtenir les statistiques des demandes
 */
const getRequestStats = async (req, res) => {
  try {
    const stats = await prisma.request.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const formattedStats = {
      total: await prisma.request.count(),
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {})
    };

    res.json(formattedStats);

  } catch (err) {
    console.error('❌ Erreur récupération statistiques:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer les statistiques" 
    });
  }
};

export { 
  createRequest, 
  getRequests, 
  getRequestById, 
  updateRequestStatus,
  updateRequest, 
  deleteRequest,
  getRequestStats 
};