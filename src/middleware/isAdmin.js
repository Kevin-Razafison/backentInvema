/**
 * ========================================
 * IS ADMIN MIDDLEWARE - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Middleware simple pour vérifier le rôle admin
 * Version améliorée avec meilleure gestion d'erreurs
 */

/**
 * Vérifie que l'utilisateur authentifié est un administrateur
 */
const isAdmin = (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentification requise",
        code: "AUTH_REQUIRED"
      });
    }

    // Vérifier le rôle admin
    if (req.user.role !== "ADMIN") {
      console.warn(
        `⚠️ Accès admin refusé pour: ${req.user.email} (${req.user.role})`
      );
      
      return res.status(403).json({ 
        error: "Accès refusé. Administrateur uniquement",
        code: "ADMIN_ONLY"
      });
    }

    // L'utilisateur est admin
    next();

  } catch (err) {
    console.error('❌ Erreur dans isAdmin:', err);
    res.status(500).json({ 
      error: "Erreur de vérification des permissions",
      code: "PERMISSION_CHECK_ERROR"
    });
  }
};

export default isAdmin;