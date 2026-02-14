/**
 * ========================================
 * SUPPLIER CONTROLLER - AVEC CLOUDINARY
 * ========================================
 * 
 * Upload d'images sur Cloudinary au lieu du système de fichiers local
 * Meilleur pour la production et le scaling
 */

import prisma from "../prisma.js";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage Cloudinary pour Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'invema/suppliers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'), false);
    }
  }
});

/**
 * Extrait le public_id d'une URL Cloudinary
 */
function extractCloudinaryPublicId(url) {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  return `${folder}/${filename.split('.')[0]}`;
}

/**
 * Crée un nouveau fournisseur avec upload sur Cloudinary
 */
const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, category } = req.body;
    
    // L'URL de l'image vient de Cloudinary
    const imageUrl = req.file ? req.file.path : null;

    // Validation
    if (!name) return res.status(400).json({ error: "Le champ name est requis." });
    if (!phone) return res.status(400).json({ error: "Le champ phone est requis." });
    if (!email) return res.status(400).json({ error: "Le champ email est requis." });
    if (!address) return res.status(400).json({ error: "Le champ address est requis." });
    if (!imageUrl) return res.status(400).json({ error: "Une image est requise." });
    if (!category) return res.status(400).json({ error: "Le champ category est requis." });

    // Créer le fournisseur
    const supplier = await prisma.supplier.create({
      data: { name, phone, email, address, imageUrl, category },
    });

    console.log('✅ Fournisseur créé avec image Cloudinary:', imageUrl);
    res.status(201).json(supplier);

  } catch (err) {
    console.error('❌ Erreur création fournisseur:', err);
    
    // Supprimer l'image de Cloudinary si la création échoue
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (error) {
        console.error('Erreur suppression image Cloudinary:', error);
      }
    }
    
    res.status(500).json({ error: "Impossible de créer le fournisseur." });
  }
};

/**
 * Lister tous les fournisseurs
 */
const getSuppliers = async (_req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { 
        products: true,
        orders: true,
        _count: { select: { products: true } }
      }
    });
    
    const suppliersWithCount = suppliers.map(supplier => ({
      ...supplier, 
      totalProducts: supplier._count.products
    }));
    
    res.json(suppliersWithCount);
  } catch (err) {
    console.error('❌ Erreur récupération fournisseurs:', err);
    res.status(500).json({ error: "Impossible de récupérer les fournisseurs." });
  }
};

/**
 * Obtenir un fournisseur par ID
 */
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: { products: true, orders: true },
    });
    
    if (!supplier) {
      return res.status(404).json({ error: "Fournisseur non trouvé." });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error('❌ Erreur récupération fournisseur:', err);
    res.status(500).json({ error: "Impossible de récupérer le fournisseur." });
  }
};

/**
 * Mettre à jour un fournisseur
 */
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, category } = req.body;

    // Validation basique
    if (!name || !phone || !email) {
      return res.status(400).json({ error: "Champs manquants (name, phone, email requis)" });
    }

    // Récupérer le fournisseur existant
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: "Fournisseur introuvable" });
    }

    let imageUrl = existingSupplier.imageUrl;

    // Si nouvelle image uploadée
    if (req.file) {
      imageUrl = req.file.path;

      // Supprimer l'ancienne image de Cloudinary
      if (existingSupplier.imageUrl) {
        try {
          const publicId = extractCloudinaryPublicId(existingSupplier.imageUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log('✅ Ancienne image supprimée de Cloudinary');
          }
        } catch (error) {
          console.error('⚠️ Erreur suppression ancienne image:', error);
        }
      }
    }

    // Mise à jour
    const updated = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { name, phone, email, address, category, imageUrl },
    });

    console.log('✅ Fournisseur mis à jour');
    res.json(updated);

  } catch (err) {
    console.error('❌ Erreur modification fournisseur:', err);
    res.status(500).json({ error: "Impossible de mettre à jour le fournisseur." });
  }
};

/**
 * Supprimer un fournisseur et son image
 */
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le fournisseur existe
    const existing = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Fournisseur introuvable" });
    }

    // Supprimer l'image de Cloudinary
    if (existing.imageUrl) {
      try {
        const publicId = extractCloudinaryPublicId(existing.imageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log('✅ Image supprimée de Cloudinary');
        }
      } catch (error) {
        console.error('⚠️ Erreur suppression image Cloudinary:', error);
      }
    }

    // Supprimer le fournisseur
    await prisma.supplier.delete({
      where: { id: parseInt(id) }
    });

    console.log('✅ Fournisseur supprimé');
    res.json({ message: "Fournisseur supprimé avec succès." });

  } catch (err) {
    console.error("❌ Erreur suppression fournisseur:", err);
    res.status(500).json({ error: "Impossible de supprimer le fournisseur." });
  }
};

export { 
  createSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier 
};