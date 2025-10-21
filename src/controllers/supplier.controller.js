import prisma from "../prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./fournisseursImages";
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename : function(req, file, cb){
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });
// Créer un fournisseur
const createSupplier = async (req, res) => {
  const { name, phone, email, address, category } = req.body;
  const imageUrl = req.file ? `/fournisseursImages/${req.file.filename}` : null;

  if (!name) return res.status(400).json({ error: "Le champ name est requis." });
  if (!phone) return res.status(400).json({ error: "Le champ phone est requis." });
  if (!email) return res.status(400).json({ error: "Le champ email est requis." });
  if (!address) return res.status(400).json({ error: "Le champ address est requis." });
  if (!imageUrl) return res.status(400).json({ error: "Le champ imageUrl est requis." });
  if (!category) return res.status(400).json({ error: "Le champ category est requis." });

  try {
    const supplier = await prisma.supplier.create({
      data: { name, phone, email, address, imageUrl, category },
    });
    res.status(201).json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de créer le fournisseur." });
  }
};

//  Lister tous les fournisseurs
const getSuppliers = async (_req, res) => {
  const { id } = _req.params;
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { products: true,
         orders: true ,
         _count: { select: {products: true}}}
    });
    const suppliersWithCount = suppliers.map(supplier => ({
      ...supplier, 
      totalProducts: supplier._count.products
    }));
    res.json(suppliersWithCount)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les fournisseurs." });
  }
};

// Obtenir un fournisseur par ID
const getSupplierById = async (req, res) => {
  const { id } = req.params;
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: { products: true, orders: true },
    });
    if (!supplier) return res.status(404).json({ error: "Fournisseur non trouvé." });
    res.json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le fournisseur." });
  }
};

// Mettre à jour un fournisseur
const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, category } = req.body;
  if (!name || !phone || !email) return res.status(400).json({ error: "Champs manquants" });
  try {
    const updated = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { name, phone, email, address, category },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);if (!name || !phone || !email) return res.status(400).json({ error: "Champs manquants" });
    res.status(500).json({ error: "Impossible de mettre à jour le fournisseur." });
  }
};

// Supprimer un fournisseur
const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.supplier.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Fournisseur supprimé avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de supprimer le fournisseur." });
  }
};



export {createSupplier, getSupplierById, getSuppliers,updateSupplier, deleteSupplier};