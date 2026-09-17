// ============================================================================
// Middleware de cloisonnement par opérateur — règle métier spécifique HAYATCOM
// (chapitre 1.2.2 du rapport : « des données [...] qui ne doivent pas être
// visibles par les équipes dédiées à un opérateur concurrent »)
//
// Usage : à appliquer sur les routes qui manipulent une ressource dont
// l'opérateur d'appartenance a déjà été chargé sur req.resourceOperateur
// (par le contrôleur, avant ce middleware, ou dans le contrôleur lui-même).
// Les rôles ADMIN et COUNTRY_MANAGER voient tout, quel que soit l'opérateur.
// ============================================================================

const ROLES_VISION_GLOBALE = ["ADMIN", "COUNTRY_MANAGER"];

function memeOperateur(req, res, next) {
  if (ROLES_VISION_GLOBALE.includes(req.user.role)) {
    return next();
  }

  if (req.user.operateur === "AUCUN") {
    // Rôles transverses (RH, Finance...) : pas de cloisonnement opérateur.
    return next();
  }

  if (req.resourceOperateur && req.resourceOperateur !== req.user.operateur) {
    return res.status(403).json({
      error: "Accès refusé : cette ressource appartient à un autre opérateur.",
    });
  }

  next();
}

module.exports = { memeOperateur };
