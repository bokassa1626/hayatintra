// ============================================================================
// Middleware d'authentification — vérifie l'access token JWT (SSO simulé)
// ============================================================================
const { verifyAccessToken } = require("../services/token.service");
const prisma = require("../config/prisma");

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    // On recharge l'utilisateur pour être sûr qu'il est toujours actif
    // (ex: désactivé entre-temps par un admin) — cohérent avec la gestion
    // centralisée des comptes décrite au chapitre 2.2.4 du rapport.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: "Compte introuvable ou désactivé." });
    }

    req.user = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role.nom,
      direction: user.direction,
      operateur: user.operateur,
      managerId: user.managerId,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

module.exports = { authenticate };
