// ============================================================================
// Authentification Socket.IO — réutilise le même access token JWT que l'API
// REST (principe du SSO : un seul jeton pour tous les modules de la plateforme).
// Le client doit se connecter avec : io(URL, { auth: { token: accessToken } })
// ============================================================================
const { verifyAccessToken } = require("../services/token.service");
const prisma = require("../config/prisma");

function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentification requise (token manquant)."));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.userId = payload.sub;
    socket.userRole = payload.role;
    next();
  } catch (err) {
    next(new Error("Token invalide ou expiré."));
  }
}

/**
 * À appeler une fois la connexion établie : place le socket dans une "room"
 * personnelle (user:<id>), ce qui permet d'émettre facilement un événement à
 * un utilisateur précis depuis n'importe quel contrôleur, quel que soit le
 * nombre d'onglets/appareils qu'il a ouverts.
 */
async function joinPersonalRoom(socket) {
  socket.join(`user:${socket.userId}`);
}

module.exports = { socketAuthMiddleware, joinPersonalRoom };
