/**
 * ========================================
 * REQUIRE ROLE MIDDLEWARE - VERSION COMPLÈTE
 * ========================================
 * 
 * Middleware pour restreindre l'accès selon le rôle
 */

/**
 * Middleware générique pour vérifier un rôle spécifique
 */
const requireRole = (role) => {
  return (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({ 
          error: "Authentification requise",
          code: "AUTH_REQUIRED"
        });
      }

      // Vérifier le rôle
      if (req.user.role !== role) {
        console.warn(
          `⚠️ Accès ${role} refusé pour: ${req.user.email} (${req.user.role})`
        );
        
        return res.status(403).json({ 
          error: `Accès refusé. Rôle ${role} requis`,
          code: "INSUFFICIENT_ROLE"
        });
      }

      // L'utilisateur a le bon rôle
      next();

    } catch (err) {
      console.error('❌ Erreur dans requireRole:', err);
      res.status(500).json({ 
        error: "Erreur de vérification des permissions",
        code: "PERMISSION_CHECK_ERROR"
      });
    }
  };
};

/**
 * Middleware pour vérifier le rôle ADMIN
 */
const requireAdmin = requireRole("ADMIN");

/**
 * Middleware pour vérifier le rôle EMPLOYE
 */
const requireEmploye = requireRole("EMPLOYE");

/**
 * Middleware pour vérifier le rôle MAGASINIER
 */
const requireMagasinier = requireRole("MAGASINIER");

/**
 * Middleware pour vérifier si l'utilisateur a au moins un des rôles spécifiés
 */
const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Authentification requise",
          code: "AUTH_REQUIRED"
        });
      }

      if (!roles.includes(req.user.role)) {
        console.warn(
          `⚠️ Accès refusé pour: ${req.user.email} (${req.user.role}). Rôles acceptés: ${roles.join(', ')}`
        );
        
        return res.status(403).json({ 
          error: `Accès refusé. Un des rôles suivants est requis: ${roles.join(', ')}`,
          code: "INSUFFICIENT_ROLE"
        });
      }

      next();

    } catch (err) {
      console.error('❌ Erreur dans requireAnyRole:', err);
      res.status(500).json({ 
        error: "Erreur de vérification des permissions",
        code: "PERMISSION_CHECK_ERROR"
      });
    }
  };
};

export { 
  requireRole, 
  requireAdmin, 
  requireEmploye, 
  requireMagasinier,
  requireAnyRole 
};

export default requireRole;