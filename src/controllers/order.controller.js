import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4000";

// ---------------- Création commande ----------------
const createOrder = async (req, res) => {
  let { supplierId, items } = req.body;
  supplierId = parseInt(supplierId, 10);

  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "supplierId et items sont requis." });
  }

  try {
    const order = await prisma.order.create({
      data: {
        supplierId,
        items: {
          create: items.map(i => ({
            productId: parseInt(i.id, 10), // ✅ Conversion String -> Int
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true, supplier: true },
    });

    // Génération token JWT
    const token = jwt.sign(
      { orderId: order.id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Envoi email via le service universel
    if (order.supplier.email) {
      console.log(order.supplier.email);
      const html = `
        <p>Bonjour ${order.supplier.name},</p>
        <p>Vous avez une nouvelle commande #${order.id}.</p>
        <a href="${FRONTEND_URL}/api/orders/${order.id}/confirm?token=${token}" 
           style="display:inline-block;padding:10px 20px;margin:5px;background-color:green;color:white;text-decoration:none;border-radius:5px;">
           Confirmer
        </a>
        <a href="${FRONTEND_URL}/api/orders/${order.id}/reject?token=${token}" 
           style="display:inline-block;padding:10px 20px;margin:5px;background-color:red;color:white;text-decoration:none;border-radius:5px;">
           Rejeter
        </a>
      `;

      const text = `Bonjour ${order.supplier.name},\nVous avez une nouvelle commande #${order.id}.\nConfirmer: ${FRONTEND_URL}/api/orders/${order.id}/confirm?token=${token}\nRejeter: ${FRONTEND_URL}/api/orders/${order.id}/reject?token=${token}`;

      try {
        await sendEmail({
          to: order.supplier.email,
          subject: `Nouvelle commande #${order.id}`,
          html,
          text,
        });
      } catch (err) {
        console.error(`❌ Impossible d'envoyer l'email à ${order.supplier.email}`, err.message);
      }
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de créer la commande." });
  }
};

// ---------------- Mise à jour commande ----------------
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, supplierId } = req.body;

  const validStatuses = ["PENDING", "APPROVED", "REJECTER", "PREPARED", "PICKEDUP"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Statut invalide." });
  }

  try {
    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        ...(status !== undefined && { status }),
        ...(supplierId !== undefined && { supplierId }),
      },
      include: { items: true, supplier: true },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Impossible de mettre à jour la commande" });
  }
};

// ---------------- Supprimer commande ----------------
const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.orderItem.deleteMany({ where: { orderId: parseInt(id) } });
    await prisma.order.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Commande supprimée avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de supprimer la commande." });
  }
};

// ---------------- Confirmation via email ----------------
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.orderId !== Number(id)) return res.status(403).send("Token invalide");

    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) return res.status(404).send("Commande non trouvée");
    if (order.tokenUsed) return res.status(400).send("Ce lien a déjà été utilisé");

    await prisma.order.update({
      where: { id: Number(id) },
      data: { status: "APPROVED", tokenUsed: true },
    });

    res.send("✅ Commande confirmée !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la confirmation");
  }
};

// ---------------- Rejet via email ----------------
const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.orderId !== Number(id)) return res.status(403).send("Token invalide");

    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) return res.status(404).send("Commande non trouvée");
    if (order.tokenUsed) return res.status(400).send("Ce lien a déjà été utilisé");

    await prisma.order.update({
      where: { id: Number(id) },
      data: { status: "REJECTER", tokenUsed: true },
    });

    res.send("❌ Commande rejetée !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors du rejet");
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        },
        supplier: true
      }
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les commandes" });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.order.findMany({
      where: {
        status: { in: ["APPROVED", "REJECTER"] },
        createdAt: {
          gte: new Date(Date.now() - 24*60*60*1000) // dernières 24h
        }
      },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les notifications" });
  }
};


// ---------------- Export ----------------
export {
  getNotifications,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
  rejectOrder,
  getOrders
};
