// ============================================================================
// Contrôleur d'authentification — SSO simulé (§1 du prompt maître)
// ============================================================================
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const {
  signAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} = require("../services/token.service");
const { logAudit } = require("../services/audit.service");

async function login(req, res) {
  const { email, motDePasse } = req.body;
  const ip = req.ip;

  if (!email || !motDePasse) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  // Message volontairement identique dans les deux cas (email inconnu / mdp
  // incorrect) pour ne pas révéler si un email existe (bonne pratique OWASP
  // citée au §2.3.1 du rapport).
  const echecGenerique = () => res.status(401).json({ error: "Identifiants invalides." });

  if (!user || !user.actif) {
    await logAudit({ action: "LOGIN_FAILED", details: `email=${email}`, ip });
    return echecGenerique();
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, user.motDePasseHash);
  if (!motDePasseValide) {
    await logAudit({ userId: user.id, action: "LOGIN_FAILED", ip });
    return echecGenerique();
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { derniereConnexion: new Date() },
  });

  await logAudit({ userId: user.id, action: "LOGIN", ip });

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role.nom,
      direction: user.direction,
      operateur: user.operateur,
    },
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken requis." });
  }

  const record = await verifyRefreshToken(refreshToken);
  if (!record) {
    return res.status(401).json({ error: "Refresh token invalide ou expiré." });
  }

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    include: { role: true },
  });

  if (!user || !user.actif) {
    return res.status(401).json({ error: "Compte introuvable ou désactivé." });
  }

  const accessToken = signAccessToken(user);
  return res.json({ accessToken });
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  await logAudit({ userId: req.user?.id, action: "LOGOUT", ip: req.ip });

  return res.status(204).send();
}

async function me(req, res) {
  // req.user est déjà attaché par le middleware authenticate
  return res.json({ user: req.user });
}

module.exports = { login, refresh, logout, me };
