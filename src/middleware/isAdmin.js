const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({error: "Accès refusé. Adimn uniquement."})
  }
  next();
};

export default isAdmin;