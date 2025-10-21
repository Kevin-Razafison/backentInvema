import multer from "multer";
import prisma from "../prisma.js";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./productImages";
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename : function(req, file, cb){
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
export const upload = multer({storage});
const createProduct = async (req, res) => {
    let {name, description, sku, quantity, alertLevel, price, location, categoryId, supplierId } = req.body;
    const imageUrl = req.file? `/productImages/${req.file.filename}`: null;

     quantity = parseInt(quantity, 10);
     price = parseFloat(price);
     alertLevel = parseInt(alertLevel);
     categoryId = parseInt(categoryId, 10);
     supplierId = supplierId ? parseInt(supplierId, 10) : null;

    if (!name) return res.status(400).json({ error: "Le champ name est requis." });
    if (!description) return res.status(400).json({ error: "Le champ description est requis." });
    if (!sku) return res.status(400).json({ error: "Le champ sku est requis." });
    if (!quantity) return res.status(400).json({ error: "Le champ quantity est requis." });
    if (!price) return res.status(400).json({ error: "Le champ price est requis." });
    if (!location) return res.status(400).json({ error: "Le champ location est requis." });
    if (!categoryId) return res.status(400).json({ error: "Le champ categoryId est requis." });
    if (!supplierId) return res.status(400).json({ error: "Le champ supplierId est requis." });
    if (!alertLevel) return res.status(400).json({ error: "Le champ alertLevel est requis." });
    if (!imageUrl) return res.status(400).json({ error: "Le champ imageUrl est requis." });


    try{
        const newProduct = await prisma.product.create({
            data: {name, description, sku, quantity, alertLevel, price, location, imageUrl, categoryId, supplierId },
        });
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Erreur création produit"});
    }
};

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,            // catégorie associée
        supplier: true,            // fournisseur associé
        orderItems: {              // tous les items de commande liés à ce produit
          include: {
            order: {               // inclure aussi la commande associée
              include: {
                supplier: true,    // et le fournisseur de la commande
                items: true        // tous les items de la commande
              }
            }
          }
        }
      }
    });

    res.json(products);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const modifyProduct = async (req, res) => {
    const { id } = req.params;
    
    let {
        name,
        description,
        sku,
        quantity,
        price,
        location,
        imageUrl,
        categoryId,
        supplierId
    } = req.body;

    if (req.file) {
        imageUrl = req.file.path; // or however you handle file paths
    }

    try {
        quantity = quantity !== undefined ? parseInt(quantity, 10) : undefined;
        price = price !== undefined ? parseFloat(price) : undefined;
        categoryId = categoryId !== undefined ? parseInt(categoryId, 10) : undefined;
        supplierId = supplierId !== undefined ? parseInt(supplierId, 10) : undefined;

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
        res.json(updated);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Impossible de mettre à jour le produit"});
    }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le produit existe
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    // Supprimer le fichier image du serveur s'il existe
    if (existing.imageUrl) {
      // Ton imageUrl ressemble à : "/productImages/1739719273832.png"
      const filePath = path.join(process.cwd(), existing.imageUrl);

      // Vérifie si le fichier existe sur le disque
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Supprime le fichier
        console.log(`🗑️ Image supprimée : ${filePath}`);
      } else {
        console.warn(`⚠️ Image non trouvée sur le disque : ${filePath}`);
      }
    }

    // Supprimer le produit dans la base
    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ message: `Produit ${id} et image supprimés avec succès` });
  } catch (err) {
    console.error("Erreur suppression produit:", err);
    res.status(500).json({ error: "Erreur lors de la suppression du produit" });
  }
};

export {getProducts, createProduct, modifyProduct, deleteProduct}