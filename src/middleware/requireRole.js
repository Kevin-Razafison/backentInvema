/**
 * REQUIRE ROLE MIDDLEWARE - VERSION CORRIGÉE
 */

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentification requise",
        code: "AUTH_REQUIRED"
      });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: `Accès refusé. Rôle requis: ${role}`,
        code: "INSUFFICIENT_ROLE"
      });
    }
    next();
  };
};

// Middlewares simples
const requireAdmin = requireRole("ADMIN");
const requireEmploye = requireRole("EMPLOYE");

const requireMagasinier = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentification requise",
      code: "AUTH_REQUIRED"
    });
  }
  
  if (req.user.role !== "ADMIN" && req.user.role !== "MAGASINIER") {
    return res.status(403).json({ 
      error: "Accès refusé. Admin ou Magasinier requis",
      code: "INSUFFICIENT_ROLE",
      userRole: req.user.role // Pour debug
    });
  }
  
  next();
};

// Middleware flexible pour accepter plusieurs rôles
const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentification requise",
        code: "AUTH_REQUIRED"
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Accès refusé. Rôles acceptés: ${roles.join(', ')}`,
        code: "INSUFFICIENT_ROLE",
        userRole: req.user.role // Pour debug
      });
    }
    next();
  };
};

// Middleware pour vérifier si c'est le propriétaire OU un admin
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentification requise",
      code: "AUTH_REQUIRED"
    });
  }
  
  const userId = parseInt(req.params.id);
  
  if (req.user.role === "ADMIN" || req.user.id === userId) {
    return next();
  }
  
  return res.status(403).json({ 
    error: "Accès refusé. Vous devez être admin ou propriétaire",
    code: "INSUFFICIENT_ROLE"
  });
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