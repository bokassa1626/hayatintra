// ============================================================================
// Règle de cloisonnement par opérateur pour le partage de fichiers
// (chapitre 1.2.2 du rapport)
// ============================================================================

const ROLES_VISION_GLOBALE = ["ADMIN", "COUNTRY_MANAGER"];

/**
 * @param {Object} user  req.user (avec .role et .operateur)
 * @param {Object} dossier  enregistrement Dossier (avec .operateur)
 * @returns {boolean}
 */
function peutAccederDossier(user, dossier) {
  if (ROLES_VISION_GLOBALE.includes(user.role)) return true;
  if (dossier.operateur === "AUCUN") return true; // dossier transverse (RH, Finance...)
  return dossier.operateur === user.operateur;
}

module.exports = { peutAccederDossier };
