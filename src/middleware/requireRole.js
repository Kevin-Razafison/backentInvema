// Restreint l'accès selon le rôle
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: "Accès refusé, rôle insuffisant" });
    }

    next();
  };
};

export { requireRole };
