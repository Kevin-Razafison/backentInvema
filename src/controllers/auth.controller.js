import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Connexion
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Utilisateur non trouvé." });

    const isvalid = await bcrypt.compare(password, user.password);
    if (!isvalid) return res.status(401).json({ error: "Mot de passe incorrect." });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.log("Erreur login;",err);
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
};

// Middleware pour protéger les routes
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token manquant." });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token invalide." });
    req.user = decoded; // { userId, role }
    next();
  });
};

export {login,requireAuth}