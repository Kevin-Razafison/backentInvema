/**
 * ========================================
 * REQUIRE ROLE MIDDLEWARE - VERSION COMPLÈTE
 * ========================================
 */

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Accès refusé, rôle insuffisant" });
    }
    next();
  };
};

const requireAdmin = requireRole("ADMIN");
const requireEmploye = requireRole("EMPLOYE");
const requireMagasinier = requireRole("MAGASINIER");

const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    next();
  };
};

// Middleware pour vérifier si c'est le propriétaire OU un admin
// IMPORTANT: C'est un middleware direct, pas une factory function
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  
  const userId = parseInt(req.params.id);
  
  if (req.user.role === "ADMIN" || req.user.id === userId) {
    return next();
  }
  
  return res.status(403).json({ error: "Accès refusé" });
};

export { 
  requireRole, 
  requireAdmin, 
  requireEmploye, 
  requireMagasinier,
  requireAnyRole,
  requireOwnerOrAdmin
};

export default requireRole;