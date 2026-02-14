/**
 * ========================================
 * AUTH MIDDLEWARE - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Gestion d'erreurs plus précise
 * - Validation renforcée du token
 * - Support de rafraîchissement
 * - Logging cohérent
 */

import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET non défini dans les variables d\'environnement');
}

/**
 * Middleware d'authentification principal
 * Vérifie le token JWT et charge les informations utilisateur
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Vérifier la présence du header
    if (!authHeader) {
      return res.status(401).json({ 
        error: "Token d'authentification manquant" 
      });
    }

    // Vérifier le format Bearer
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Format du token invalide. Utilisez: Bearer <token>" 
      });
    }

    // Extraire le token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        error: "Token vide" 
      });
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: "Session expirée. Veuillez vous reconnecter",
          code: "TOKEN_EXPIRED"
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: "Token invalide",
          code: "TOKEN_INVALID"
        });
      }
      throw err;
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true 
      },
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Utilisateur non trouvé ou supprimé",
        code: "USER_NOT_FOUND"
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();

  } catch (err) {
    console.error('❌ Erreur dans le middleware auth:', err);
    res.status(500).json({ 
      error: "Erreur d'authentification",
      code: "AUTH_ERROR"
    });
  }
};

/**
 * Middleware optionnel d'authentification
 * Continue même sans token, mais charge l'utilisateur si présent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Pas de token, mais on continue
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true 
        },
      });

      req.user = user || null;
      req.token = token;
      req.tokenPayload = decoded;

    } catch (err) {
      // Token invalide, mais on continue quand même
      req.user = null;
    }

    next();

  } catch (err) {
    console.error('❌ Erreur dans optionalAuth:', err);
    req.user = null;
    next();
  }
};

/**
 * Vérifier si l'utilisateur est connecté (alias de auth)
 */
const requireAuth = auth;

export default auth;
export { auth, optionalAuth, requireAuth };