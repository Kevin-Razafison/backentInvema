/**
 * ========================================
 * AUTH CONTROLLER - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Meilleure gestion des erreurs
 * - Validation des entrées renforcée
 * - Messages d'erreur plus clairs
 * - Logging amélioré
 * - Sécurité renforcée
 */

import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET non défini dans les variables d\'environnement');
}

/**
 * Connexion utilisateur
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des entrées
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email et mot de passe sont requis." 
      });
    }

    // Validation format email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Format d'email invalide." 
      });
    }

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Email ou mot de passe incorrect." 
      });
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: "Email ou mot de passe incorrect." 
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        name: user.name, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`✅ Connexion réussie pour: ${user.email}`);

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });

  } catch (err) {
    console.error('❌ Erreur lors de la connexion:', err);
    res.status(500).json({ 
      error: "Erreur lors de la connexion. Veuillez réessayer." 
    });
  }
};

/**
 * Middleware pour protéger les routes
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: "Token d'authentification manquant." 
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Format du token invalide. Utilisez: Bearer <token>" 
      });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: "Session expirée. Veuillez vous reconnecter." 
          });
        }
        return res.status(403).json({ 
          error: "Token invalide." 
        });
      }

      req.user = decoded;
      next();
    });

  } catch (err) {
    console.error('❌ Erreur dans requireAuth:', err);
    res.status(500).json({ 
      error: "Erreur d'authentification." 
    });
  }
};

/**
 * Récupérer les informations de l'utilisateur connecté
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
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
      error: "Erreur lors de la récupération des informations." 
    });
  }
};

/**
 * Déconnexion (côté client principalement, mais peut être étendu)
 */
const logout = async (req, res) => {
  try {
    // Dans une implémentation avec blacklist de tokens, on ajouterait le token ici
    console.log(`✅ Déconnexion pour l'utilisateur ID: ${req.user?.id}`);
    
    res.json({ 
      message: "Déconnexion réussie." 
    });

  } catch (err) {
    console.error('❌ Erreur lors de la déconnexion:', err);
    res.status(500).json({ 
      error: "Erreur lors de la déconnexion." 
    });
  }
};

/**
 * Rafraîchir le token (optionnel)
 */
const refreshToken = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ 
        error: "Utilisateur non trouvé." 
      });
    }

    // Générer un nouveau token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        name: user.name, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`✅ Token rafraîchi pour: ${user.email}`);

    res.json({ token });

  } catch (err) {
    console.error('❌ Erreur rafraîchissement token:', err);
    res.status(500).json({ 
      error: "Erreur lors du rafraîchissement du token." 
    });
  }
};

export { 
  login, 
  requireAuth, 
  getCurrentUser, 
  logout, 
  refreshToken 
};