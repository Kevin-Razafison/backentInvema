/**
 * ========================================
 * PRODUCT CONTROLLER - AVEC CLOUDINARY
 * ========================================
 * 
 * Upload d'images sur Cloudinary au lieu du système de fichiers local
 * Meilleur pour la production et le scaling
 */

import multer from "multer";
import prisma from "../prisma.js";
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
    folder: 'invema/products',
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
 * Crée un nouveau produit avec upload sur Cloudinary
 */
const createProduct = async (req, res) => {
  try {
    let { name, description, sku, quantity, alertLevel, price, location, categoryId, supplierId } = req.body;
    
    // L'URL de l'image vient de Cloudinary
    const imageUrl = req.file ? req.file.path : null;

    // Validation
    if (!name) return res.status(400).json({ error: "Le champ name est requis." });
    if (!imageUrl) return res.status(400).json({ error: "Une image est requise." });

    // Conversion des types
    quantity = parseInt(quantity, 10);
    price = parseFloat(price);
    alertLevel = parseInt(alertLevel);
    categoryId = parseInt(categoryId, 10);
    supplierId = supplierId ? parseInt(supplierId, 10) : null;

    // Créer le produit
    const newProduct = await prisma.product.create({
      data: { 
        name, 
        description, 
        sku, 
        quantity, 
        alertLevel, 
        price, 
        location, 
        imageUrl, // URL Cloudinary
        categoryId, 
        supplierId 
      },
    });

    console.log('✅ Produit créé avec image Cloudinary:', imageUrl);
    res.status(201).json(newProduct);

  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    
    // Supprimer l'image de Cloudinary si la création échoue
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        console.error('Erreur suppression image Cloudinary:', err);
      }
    }
    
    res.status(500).json({ error: "Erreur création produit" });
  }
};

/**
 * Récupère tous les produits
 */
const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        orderItems: {
          include: {
            order: {
              include: {
                supplier: true,
                items: true
              }
            }
          }
        }
      }
    });

    res.json(products);
  } catch (error) {
    console.error("❌ Erreur récupération produits:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Modifie un produit existant
 */
const modifyProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, sku, quantity, price, location, categoryId, supplierId } = req.body;

    // Récupérer le produit existant
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    let imageUrl = existingProduct.imageUrl;

    // Si nouvelle image uploadée
    if (req.file) {
      imageUrl = req.file.path;

      // Supprimer l'ancienne image de Cloudinary
      if (existingProduct.imageUrl) {
        try {
          const publicId = extractCloudinaryPublicId(existingProduct.imageUrl);
          await cloudinary.uploader.destroy(publicId);
          console.log('✅ Ancienne image supprimée de Cloudinary');
        } catch (err) {
          console.error('⚠️ Erreur suppression ancienne image:', err);
        }
      }
    }

    // Conversion des types
    quantity = quantity !== undefined ? parseInt(quantity, 10) : undefined;
    price = price !== undefined ? parseFloat(price) : undefined;
    categoryId = categoryId !== undefined ? parseInt(categoryId, 10) : undefined;
    supplierId = supplierId !== undefined ? parseInt(supplierId, 10) : undefined;

    // Mise à jour
    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        sku,
        quantity,
        price,
        location,
        imageUrl,
        categoryId,
        supplierId
      }
    });

    console.log('✅ Produit mis à jour');
    res.json(updated);

  } catch (err) {
    console.error('❌ Erreur modification produit:', err);
    res.status(500).json({ error: "Impossible de mettre à jour le produit" });
  }
};

/**
 * Supprime un produit et son image
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le produit existe
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    // Supprimer l'image de Cloudinary
    if (existing.imageUrl) {
      try {
        const publicId = extractCloudinaryPublicId(existing.imageUrl);
        await cloudinary.uploader.destroy(publicId);
        console.log('✅ Image supprimée de Cloudinary');
      } catch (err) {
        console.error('⚠️ Erreur suppression image Cloudinary:', err);
      }
    }

    // Supprimer le produit
    await prisma.product.delete({
      where: { id: Number(id) }
    });

    console.log('✅ Produit supprimé');
    res.json({ message: `Produit ${id} supprimé avec succès` });

  } catch (err) {
    console.error("❌ Erreur suppression produit:", err);
    res.status(500).json({ error: "Erreur lors de la suppression du produit" });
  }
};

/**
 * Extrait le public_id d'une URL Cloudinary
 */
function extractCloudinaryPublicId(url) {
  // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  return `${folder}/${filename.split('.')[0]}`;
}

export { getProducts, createProduct, modifyProduct, deleteProduct };

