import prisma from "../prisma.js";
import bcrypt from "bcrypt";

// Créer un utilisateur
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email et password sont requis." });
  }

  try {

    const existing = await prisma.user.findUnique({where: {email}});
    if (existing) return res.status(400).json({error: "Email déjà utilisé."});

    //hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    //créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role  // par défaut EMPLOYE
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json({ message: "Utilisateur créé avec succès",user});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de créer l'utilisateur." });
  }
};

// 📜 Lister tous les utilisateurs
const getUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, password:true , role: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs." });
  }
};

// 🔎 Obtenir un utilisateur par ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, email: true, role: true, createdAt: true, requests: true }
    });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer l'utilisateur." });
  }
};

// ✏️ Mettre à jour un utilisateur (sauf mot de passe sauf si précisé)
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (password !== undefined) data.password = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour l'utilisateur." });
  }
};

// 🗑 Supprimer un utilisateur
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur." });
  }
};

export {createUser, deleteUser,updateUser, getUsers, getUserById}
