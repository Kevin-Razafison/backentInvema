import prisma from "../prisma.js";

const createRequest = async (req, res) => {
    const {quantity, reason, productId, userId} = req.body;
    if (!quantity || !productId || !userId) {
        return res
            .status(400)
            .json({error: "quantity, productId et userId sont requis."});
    }

    try {
        const request = await prisma.request.create({
        data: {
            quantity: parseInt(quantity),
            reason,
            productId: parseInt(productId),
            userId: parseInt(userId),
        },
        include: { product: true, user: true },
    });
        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Impossible de créer la demande."});
    }
};

// Lister toutes les demandes
const getRequests = async (_req, res) => {
  try {
    const requests = await prisma.request.findMany({
      include: { product: true, user: true },
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les demandes." });
  }
};

// 🔎 Obtenir une demande par ID
const getRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await prisma.request.findUnique({
      where: { id: parseInt(id) },
      include: { product: true, user: true },
    });
    if (!request) return res.status(404).json({ error: "Demande non trouvée." });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer la demande." });
  }
};

// ✏️ Mettre à jour le statut d’une demande
const updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // ex: "APPROVED", "REJECTER", "PREPARED", "PICKEDUP"

  if (!status) return res.status(400).json({ error: "Le statut est requis." });

  try {
    const updated = await prisma.request.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { product: true, user: true },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour la demande." });
  }
};

// 🗑 Supprimer une demande
const deleteRequest = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.request.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Demande supprimée avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de supprimer la demande." });
  }
};

export {createRequest, getRequests, getRequestById, updateRequestStatus, deleteRequest};