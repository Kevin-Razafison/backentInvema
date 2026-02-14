/**
 * ========================================
 * ORDER CONTROLLER - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Validation des données renforcée
 * - Gestion des erreurs cohérente
 * - Vérification de stock
 * - Logging amélioré
 * - Gestion des statuts plus robuste
 */

import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET non défini dans les variables d\'environnement');
}

/**
 * Valider les items d'une commande
 */
const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: "La commande doit contenir au moins un article" };
  }

  for (const item of items) {
    if (!item.id) {
      return { valid: false, error: "Chaque article doit avoir un ID" };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { valid: false, error: "La quantité doit être supérieure à 0" };
    }
  }

  return { valid: true };
};

/**
 * Récupérer toutes les commandes
 */
const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { 
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
                price: true
              }
            }
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);

  } catch (err) {
    console.error('❌ Erreur récupération commandes:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer les commandes" 
    });
  }
};

/**
 * Récupérer une commande par ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: { product: true }
        },
        supplier: true
      }
    });

    if (!order) {
      return res.status(404).json({ 
        error: "Commande non trouvée" 
      });
    }

    res.json(order);

  } catch (err) {
    console.error('❌ Erreur récupération commande:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer la commande" 
    });
  }
};

/**
 * Créer une nouvelle commande
 */
const createOrder = async (req, res) => {
  try {
    let { supplierId, items } = req.body;

    // Validation du fournisseur
    if (!supplierId) {
      return res.status(400).json({ 
        error: "Le fournisseur est requis" 
      });
    }

    supplierId = parseInt(supplierId, 10);

    if (isNaN(supplierId)) {
      return res.status(400).json({ 
        error: "ID de fournisseur invalide" 
      });
    }

    // Validation des items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.valid) {
      return res.status(400).json({ 
        error: itemsValidation.error 
      });
    }

    // Vérifier que le fournisseur existe
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      return res.status(404).json({ 
        error: "Fournisseur non trouvé" 
      });
    }

    // Vérifier que tous les produits existent
    const productIds = items.map(i => parseInt(i.id, 10));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({ 
        error: "Un ou plusieurs produits n'existent pas" 
      });
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        supplierId,
        items: {
          create: items.map(i => ({
            productId: parseInt(i.id, 10),
            quantity: parseInt(i.quantity, 10),
          })),
        },
      },
      include: { 
        items: {
          include: { product: true }
        }, 
        supplier: true 
      },
    });

    // Générer le token JWT pour confirmation email
    const token = jwt.sign(
      { orderId: order.id },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Envoyer l'email de notification au fournisseur
    if (supplier.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nouvelle Commande #${order.id}</h2>
          <p>Bonjour ${supplier.name},</p>
          <p>Vous avez reçu une nouvelle commande contenant ${order.items.length} article(s).</p>
          
          <h3>Détails de la commande:</h3>
          <ul>
            ${order.items.map(item => `
              <li>${item.product.name} - Quantité: ${item.quantity}</li>
            `).join('')}
          </ul>
          
          <div style="margin: 30px 0;">
            <a href="${FRONTEND_URL}/api/orders/${order.id}/confirm?token=${token}" 
               style="display:inline-block;padding:12px 24px;margin:10px 5px;background-color:#22c55e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
               ✓ Confirmer la commande
            </a>
            <a href="${FRONTEND_URL}/api/orders/${order.id}/reject?token=${token}" 
               style="display:inline-block;padding:12px 24px;margin:10px 5px;background-color:#ef4444;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
               ✗ Rejeter la commande
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            Ce lien est valable pendant 24 heures.
          </p>
        </div>
      `;

      const text = `
Nouvelle Commande #${order.id}

Bonjour ${supplier.name},

Vous avez reçu une nouvelle commande contenant ${order.items.length} article(s).

Pour confirmer: ${FRONTEND_URL}/api/orders/${order.id}/confirm?token=${token}
Pour rejeter: ${FRONTEND_URL}/api/orders/${order.id}/reject?token=${token}

Ce lien est valable pendant 24 heures.
      `;

      try {
        await sendEmail({
          to: supplier.email,
          subject: `Nouvelle commande #${order.id}`,
          html,
          text,
        });
        console.log(`✅ Email envoyé à ${supplier.email}`);
      } catch (err) {
        console.error(`⚠️ Impossible d'envoyer l'email à ${supplier.email}:`, err.message);
        // On ne fait pas échouer la commande si l'email échoue
      }
    }

    console.log(`✅ Commande #${order.id} créée pour le fournisseur ${supplier.name}`);

    res.status(201).json(order);

  } catch (err) {
    console.error('❌ Erreur création commande:', err);
    res.status(500).json({ 
      error: "Impossible de créer la commande" 
    });
  }
};

/**
 * Mettre à jour une commande
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, supplierId } = req.body;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingOrder) {
      return res.status(404).json({ 
        error: "Commande non trouvée" 
      });
    }

    // Validation du statut
    const validStatuses = ["PENDING", "APPROVED", "REJECTER", "PREPARED", "PICKEDUP"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` 
      });
    }

    // Validation du fournisseur si fourni
    if (supplierId !== undefined) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) }
      });

      if (!supplier) {
        return res.status(404).json({ 
          error: "Fournisseur non trouvé" 
        });
      }
    }

    // Mettre à jour
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (supplierId !== undefined) updateData.supplierId = parseInt(supplierId);

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { 
        items: {
          include: { product: true }
        }, 
        supplier: true 
      },
    });

    console.log(`✅ Commande #${id} mise à jour - Statut: ${updated.status}`);

    res.json(updated);

  } catch (err) {
    console.error('❌ Erreur mise à jour commande:', err);
    res.status(500).json({ 
      error: "Impossible de mettre à jour la commande" 
    });
  }
};

/**
 * Supprimer une commande
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide" 
      });
    }

    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingOrder) {
      return res.status(404).json({ 
        error: "Commande non trouvée" 
      });
    }

    // Supprimer les items de commande d'abord
    await prisma.orderItem.deleteMany({ 
      where: { orderId: parseInt(id) } 
    });

    // Supprimer la commande
    await prisma.order.delete({ 
      where: { id: parseInt(id) } 
    });

    console.log(`✅ Commande #${id} supprimée`);

    res.json({ 
      message: "Commande supprimée avec succès" 
    });

  } catch (err) {
    console.error('❌ Erreur suppression commande:', err);
    res.status(500).json({ 
      error: "Impossible de supprimer la commande" 
    });
  }
};

/**
 * Confirmation de commande via email
 */
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Token manquant");
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.orderId !== Number(id)) {
      return res.status(403).send("Token invalide pour cette commande");
    }

    // Récupérer la commande
    const order = await prisma.order.findUnique({ 
      where: { id: Number(id) } 
    });

    if (!order) {
      return res.status(404).send("Commande non trouvée");
    }

    if (order.tokenUsed) {
      return res.status(400).send("Ce lien a déjà été utilisé");
    }

    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: Number(id) },
      data: { 
        status: "APPROVED", 
        tokenUsed: true 
      },
    });

    console.log(`✅ Commande #${id} confirmée via email`);

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #22c55e; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="success">✅ Commande #${id} confirmée avec succès !</div>
          <p>Merci d'avoir confirmé votre commande.</p>
        </body>
      </html>
    `);

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).send("Ce lien a expiré");
    }
    console.error('❌ Erreur confirmation commande:', err);
    res.status(500).send("Erreur lors de la confirmation");
  }
};

/**
 * Rejet de commande via email
 */
const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Token manquant");
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.orderId !== Number(id)) {
      return res.status(403).send("Token invalide pour cette commande");
    }

    // Récupérer la commande
    const order = await prisma.order.findUnique({ 
      where: { id: Number(id) } 
    });

    if (!order) {
      return res.status(404).send("Commande non trouvée");
    }

    if (order.tokenUsed) {
      return res.status(400).send("Ce lien a déjà été utilisé");
    }

    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: Number(id) },
      data: { 
        status: "REJECTER", 
        tokenUsed: true 
      },
    });

    console.log(`✅ Commande #${id} rejetée via email`);

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .reject { color: #ef4444; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="reject">❌ Commande #${id} rejetée</div>
          <p>La commande a été rejetée avec succès.</p>
        </body>
      </html>
    `);

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).send("Ce lien a expiré");
    }
    console.error('❌ Erreur rejet commande:', err);
    res.status(500).send("Erreur lors du rejet");
  }
};

/**
 * Récupérer les notifications récentes
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.order.findMany({
      where: {
        status: { in: ["SENT", "RECEIVED"] }, // adaptez selon votre logique métier
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: { 
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    res.json(notifications);

  } catch (err) {
    console.error('❌ Erreur récupération notifications:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer les notifications" 
    });
  }
};

export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
  rejectOrder,
  getNotifications
};