// ============================================================================
// Contrôleur Dossiers — arborescence du partage de fichiers
// (simulation Samba — voir chapitre 2.2.3 du rapport, Itération 3 du prompt maître)
// ============================================================================
const prisma = require("../config/prisma");
const { logAudit } = require("../services/audit.service");
const { peutAccederDossier } = require("../services/acces-fichiers.service");

/** Renvoie tous les dossiers visibles par l'utilisateur (à plat, avec parentId,
 * pour que le frontend reconstitue l'arborescence). */
async function listerDossiers(req, res) {
  const tous = await prisma.dossier.findMany({
    include: {
      proprietaire: { select: { id: true, nom: true, prenom: true } },
      _count: { select: { fichiers: { where: { supprime: false } }, enfants: true } },
    },
    orderBy: { nom: "asc" },
  });

  const visibles = tous.filter((d) => peutAccederDossier(req.user, d));

  return res.json(visibles);
}

async function creerDossier(req, res) {
  const { nom, parentId, direction, operateur } = req.body;

  if (!nom) {
    return res.status(400).json({ error: "Le nom du dossier est requis." });
  }

  // Un utilisateur cloisonné (non ADMIN/COUNTRY_MANAGER) ne peut créer un
  // dossier que pour son propre opérateur (ou "AUCUN" s'il est transverse).
  let operateurFinal = operateur || "AUCUN";
  if (!["ADMIN", "COUNTRY_MANAGER"].includes(req.user.role)) {
    operateurFinal = req.user.operateur;
  }

  if (parentId) {
    const parent = await prisma.dossier.findUnique({ where: { id: Number(parentId) } });
    if (!parent) {
      return res.status(400).json({ error: "Dossier parent introuvable." });
    }
    if (!peutAccederDossier(req.user, parent)) {
      return res.status(403).json({ error: "Accès refusé au dossier parent." });
    }
  }

  const dossier = await prisma.dossier.create({
    data: {
      nom,
      parentId: parentId ? Number(parentId) : null,
      direction: direction || null,
      operateur: operateurFinal,
      proprietaireId: req.user.id,
    },
  });

  await logAudit({
    userId: req.user.id,
    action: "CREATE_FOLDER",
    ressource: "Dossier",
    ressourceId: dossier.id,
    details: `nom=${nom} operateur=${operateurFinal}`,
    ip: req.ip,
  });

  return res.status(201).json(dossier);
}

async function supprimerDossier(req, res) {
  const dossierId = Number(req.params.id);

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      _count: { select: { fichiers: { where: { supprime: false } }, enfants: true } },
    },
  });

  if (!dossier) {
    return res.status(404).json({ error: "Dossier introuvable." });
  }
  if (!peutAccederDossier(req.user, dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  if (dossier._count.fichiers > 0 || dossier._count.enfants > 0) {
    return res.status(409).json({
      error: "Impossible de supprimer un dossier non vide. Videz-le d'abord.",
    });
  }

  await prisma.dossier.delete({ where: { id: dossierId } });

  await logAudit({
    userId: req.user.id,
    action: "DELETE_FOLDER",
    ressource: "Dossier",
    ressourceId: dossierId,
    ip: req.ip,
  });

  return res.status(204).send();
}

module.exports = { listerDossiers, creerDossier, supprimerDossier };
