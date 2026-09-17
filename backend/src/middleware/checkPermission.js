// ============================================================================
// Middleware RBAC — checkPermission(action, ressource)
// À appliquer sur chaque route sensible, conformément au §3 du prompt maître :
// « Générer [...] un middleware Express checkPermission(action, resource)
//   appliqué à chaque route sensible. »
// ============================================================================
const prisma = require("../config/prisma");

// Petit cache en mémoire pour éviter une requête DB à chaque appel.
// Invalidé automatiquement au redémarrage du serveur (suffisant pour un
// prototype ; à remplacer par un cache Redis avec TTL en production).
let permissionsCache = null;

async function loadPermissionsCache() {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
  });

  const cache = {};
  for (const role of roles) {
    cache[role.nom] = new Set(
      role.permissions.map((rp) => `${rp.permission.action}:${rp.permission.ressource}`)
    );
  }
  permissionsCache = cache;
  return cache;
}

/** À appeler quand un admin modifie les permissions d'un rôle en base. */
function invalidatePermissionsCache() {
  permissionsCache = null;
}

function checkPermission(action, ressource) {
  return async function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    const cache = permissionsCache || (await loadPermissionsCache());
    const perms = cache[req.user.role];

    const autorise = perms && (perms.has(`${action}:${ressource}`) || perms.has(`MANAGE:${ressource}`));

    if (!autorise) {
      return res.status(403).json({
        error: `Accès refusé : le rôle ${req.user.role} n'a pas la permission ${action}:${ressource}.`,
      });
    }

    next();
  };
}

module.exports = { checkPermission, invalidatePermissionsCache };
