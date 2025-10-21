import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupère l'utilisateur depuis la base
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    req.user = user; // rôle disponible pour requireRole
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};



export default auth;
