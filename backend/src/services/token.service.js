// ============================================================================
// Service JWT — SSO simulé : un seul point de connexion pour tous les modules
// (messagerie, fichiers, rapports, admin) via un access token court + un
// refresh token long stocké en base (révocable).
// ============================================================================
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/prisma");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES_DAYS = 7; // doit correspondre à JWT_REFRESH_EXPIRES ("7d")

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role.nom,
      direction: user.direction,
      operateur: user.operateur,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

/**
 * Crée un refresh token opaque (aléatoire), le stocke en base (hashé n'est pas
 * nécessaire ici car il est déjà long et aléatoire, mais on pourrait le hasher
 * en production pour une défense en profondeur).
 */
async function issueRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString("hex");
  const expireLe = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token, userId, expireLe },
  });

  return token;
}

async function verifyRefreshToken(token) {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  if (!record || record.revoque || record.expireLe < new Date()) {
    return null;
  }
  return record;
}

async function revokeRefreshToken(token) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoque: true },
  });
}

async function revokeAllUserTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoque: false },
    data: { revoque: true },
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  verifyAccessToken,
};
