/**
 * ========================================
 * USER CONTROLLER - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Validation des emails renforcée
 * - Gestion des erreurs améliorée
 * - Pas de retour du password hashé
 * - Logging cohérent
 * - Vérifications de sécurité
 */

import prisma from "../prisma.js";
import bcrypt from "bcrypt";

/**
 * Validation du format email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validation de la force du mot de passe
 */
const isStrongPassword = (password) => {
  // Au moins 8 caractères
  return password && password.length >= 8;
};

/**
 * Créer un utilisateur
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation des champs requis
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Les champs name, email et password sont requis." 
      });
    }

    // Validation du format email
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: "Format d'email invalide." 
      });
    }

    // Validation de la force du mot de passe
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: "Le mot de passe doit contenir au moins 8 caractères." 
      });
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ 
        error: "Cet email est déjà utilisé." 
      });
    }

    // Validation du rôle si fourni
    const validRoles = ["ADMIN", "EMPLOYE", "MAGASINIER"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Rôle invalide. Valeurs acceptées: ${validRoles.join(', ')}` 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || "EMPLOYE" // par défaut EMPLOYE
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true 
      }
    });

    console.log(`✅ Utilisateur créé: ${user.email} (${user.role})`);

    res.status(201).json({ 
      message: "Utilisateur créé avec succès",
      user 
    });

  } catch (err) {
    console.error('❌ Erreur création utilisateur:', err);
    res.status(500).json({ 
      error: "Impossible de créer l'utilisateur." 
    });
  }
};

/**
 * Lister tous les utilisateurs
 */
const getUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true 
        // ⚠️ Ne jamais retourner le password, même hashé
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);

  } catch (err) {
    console.error('❌ Erreur récupération utilisateurs:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer les utilisateurs." 
    });
  }
};

/**
 * Obtenir un utilisateur par ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide." 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true, 
        requests: {
          include: {
            product: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: "Utilisateur non trouvé." 
      });
    }

    res.json(user);

  } catch (err) {
    console.error('❌ Erreur récupération utilisateur:', err);
    res.status(500).json({ 
      error: "Impossible de récupérer l'utilisateur." 
    });
  }
};

/**
 * Mettre à jour un utilisateur
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide." 
      });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ 
        error: "Utilisateur non trouvé." 
      });
    }

    const data = {};

    // Validation et ajout des champs à mettre à jour
    if (name !== undefined) {
      data.name = name.trim();
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ 
          error: "Format d'email invalide." 
        });
      }

      // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: parseInt(id) }
        }
      });

      if (emailExists) {
        return res.status(400).json({ 
          error: "Cet email est déjà utilisé." 
        });
      }

      data.email = email.toLowerCase().trim();
    }

    if (role !== undefined) {
      const validRoles = ["ADMIN", "EMPLOYE", "MAGASINIER"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: `Rôle invalide. Valeurs acceptées: ${validRoles.join(', ')}` 
        });
      }
      data.role = role;
    }

    if (password !== undefined) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ 
          error: "Le mot de passe doit contenir au moins 8 caractères." 
        });
      }
      data.password = await bcrypt.hash(password, 10);
    }

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ 
        error: "Aucun champ à mettre à jour." 
      });
    }

    // Mettre à jour l'utilisateur
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true 
      }
    });

    console.log(`✅ Utilisateur mis à jour: ${updated.email}`);

    res.json(updated);

  } catch (err) {
    console.error('❌ Erreur mise à jour utilisateur:', err);
    res.status(500).json({ 
      error: "Impossible de mettre à jour l'utilisateur." 
    });
  }
};

/**
 * Supprimer un utilisateur
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: "ID invalide." 
      });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ 
        error: "Utilisateur non trouvé." 
      });
    }

    // Empêcher la suppression si c'est le dernier admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: "Impossible de supprimer le dernier administrateur." 
        });
      }
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({ 
      where: { id: parseInt(id) } 
    });

    console.log(`✅ Utilisateur supprimé: ${existingUser.email}`);

    res.json({ 
      message: "Utilisateur supprimé avec succès." 
    });

  } catch (err) {
    console.error('❌ Erreur suppression utilisateur:', err);
    res.status(500).json({ 
      error: "Impossible de supprimer l'utilisateur." 
    });
  }
};

export { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
};