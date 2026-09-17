// ============================================================================
// Service d'audit — enregistre les actions sensibles (voir chapitre 2.2.4 /
// §2.3.1 du rapport et §4 Itération 4 du prompt maître)
// ============================================================================
const prisma = require("../config/prisma");

/**
 * Enregistre une action dans le journal d'audit.
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.action        ex: "LOGIN", "LOGOUT", "LOGIN_FAILED"
 * @param {string} [params.ressource]   ex: "User"
 * @param {number} [params.ressourceId]
 * @param {string} [params.details]
 * @param {string} [params.ip]
 */
async function logAudit({ userId = null, action, ressource, ressourceId, details, ip }) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, ressource, ressourceId, details, ip },
    });
  } catch (err) {
    // Le journal d'audit ne doit jamais faire planter la requête principale.
    console.error("[audit] Échec de l'écriture du journal d'audit :", err.message);
  }
}

module.exports = { logAudit };
