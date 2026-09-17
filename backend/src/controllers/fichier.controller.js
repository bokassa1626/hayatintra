// ============================================================================
// Contrôleur Fichiers — upload, versionnage, corbeille, téléchargement
// (simulation Samba/GED — chapitre 2.2.3 du rapport, Itération 3 du prompt maître)
// ============================================================================
const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const { logAudit } = require("../services/audit.service");
const { peutAccederDossier } = require("../services/acces-fichiers.service");
const { HISTORIQUE_DIR } = require("../middleware/uploadFichier");

const NB_VERSIONS_CONSERVEES = 3; // version courante + 2 versions précédentes

async function chargerDossierAvecVerif(req, res, dossierId) {
  const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } });
  if (!dossier) {
    res.status(404).json({ error: "Dossier introuvable." });
    return null;
  }
  if (!peutAccederDossier(req.user, dossier)) {
    res.status(403).json({ error: "Accès refusé à ce dossier." });
    return null;
  }
  return dossier;
}

async function listerFichiers(req, res) {
  const dossierId = Number(req.params.dossierId);
  const dossier = await chargerDossierAvecVerif(req, res, dossierId);
  if (!dossier) return;

  const fichiers = await prisma.fichier.findMany({
    where: { dossierId, supprime: false },
    include: { ajoutePar: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { nom: "asc" },
  });

  return res.json(fichiers);
}

async function uploaderFichier(req, res) {
  const dossierId = Number(req.params.dossierId);
  const dossier = await chargerDossierAvecVerif(req, res, dossierId);
  if (!dossier) return;

  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier fourni (champ 'fichier')." });
  }

  const nom = req.file.originalname;

  // Recherche d'un fichier existant du même nom, dans le même dossier
  // (non supprimé) : c'est ce qui déclenche le versionnage.
  const existant = await prisma.fichier.findFirst({
    where: { dossierId, nom, supprime: false },
  });

  if (!existant) {
    const fichier = await prisma.fichier.create({
      data: {
        dossierId,
        nom,
        chemin: req.file.path,
        taille: req.file.size,
        version: 1,
        ajouteParId: req.user.id,
      },
    });

    await logAudit({
      userId: req.user.id,
      action: "UPLOAD_FILE",
      ressource: "Fichier",
      ressourceId: fichier.id,
      details: `nom=${nom} version=1`,
      ip: req.ip,
    });

    return res.status(201).json(fichier);
  }

  // --- Versionnage : on archive l'ancien fichier physique, on ne conserve
  // que les NB_VERSIONS_CONSERVEES - 1 dernières versions archivées. ---
  let historique = [];
  try {
    historique = existant.historique ? JSON.parse(existant.historique) : [];
  } catch {
    historique = [];
  }

  // Déplace l'ancien fichier "courant" vers le dossier d'archive.
  const nomArchive = `v${existant.version}-${path.basename(existant.chemin)}`;
  const cheminArchive = path.join(HISTORIQUE_DIR, nomArchive);
  try {
    fs.renameSync(existant.chemin, cheminArchive);
  } catch (err) {
    console.error("[fichiers] Impossible d'archiver l'ancienne version :", err.message);
  }

  historique.unshift({
    version: existant.version,
    chemin: cheminArchive,
    taille: existant.taille,
    dateAjout: existant.dateAjout,
  });

  // Ne garde que les (NB_VERSIONS_CONSERVEES - 1) versions archivées les plus
  // récentes ; supprime physiquement les plus anciennes en trop.
  const aSupprimer = historique.slice(NB_VERSIONS_CONSERVEES - 1);
  historique = historique.slice(0, NB_VERSIONS_CONSERVEES - 1);
  for (const v of aSupprimer) {
    fs.unlink(v.chemin, () => {});
  }

  const fichierMisAJour = await prisma.fichier.update({
    where: { id: existant.id },
    data: {
      chemin: req.file.path,
      taille: req.file.size,
      version: existant.version + 1,
      historique: JSON.stringify(historique),
      ajouteParId: req.user.id,
      dateAjout: new Date(),
    },
  });

  await logAudit({
    userId: req.user.id,
    action: "UPLOAD_FILE_NEW_VERSION",
    ressource: "Fichier",
    ressourceId: fichierMisAJour.id,
    details: `nom=${nom} version=${fichierMisAJour.version}`,
    ip: req.ip,
  });

  return res.status(200).json(fichierMisAJour);
}

async function historiqueFichier(req, res) {
  const fichierId = Number(req.params.id);
  const fichier = await prisma.fichier.findUnique({
    where: { id: fichierId },
    include: { dossier: true },
  });

  if (!fichier) return res.status(404).json({ error: "Fichier introuvable." });
  if (!peutAccederDossier(req.user, fichier.dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  let historique = [];
  try {
    historique = fichier.historique ? JSON.parse(fichier.historique) : [];
  } catch {
    historique = [];
  }

  return res.json({
    versionCourante: fichier.version,
    versionsPrecedentes: historique.map((v) => ({ version: v.version, taille: v.taille, dateAjout: v.dateAjout })),
  });
}

async function telechargerVersion(req, res) {
  const fichierId = Number(req.params.id);
  const versionDemandee = Number(req.params.version);

  const fichier = await prisma.fichier.findUnique({
    where: { id: fichierId },
    include: { dossier: true },
  });
  if (!fichier) return res.status(404).json({ error: "Fichier introuvable." });
  if (!peutAccederDossier(req.user, fichier.dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  if (versionDemandee === fichier.version) {
    return res.download(fichier.chemin, fichier.nom);
  }

  let historique = [];
  try {
    historique = fichier.historique ? JSON.parse(fichier.historique) : [];
  } catch {
    historique = [];
  }

  const version = historique.find((v) => v.version === versionDemandee);
  if (!version || !fs.existsSync(version.chemin)) {
    return res.status(404).json({ error: "Cette version n'est plus disponible." });
  }

  return res.download(version.chemin, `v${versionDemandee}-${fichier.nom}`);
}

async function telechargerFichier(req, res) {
  const fichierId = Number(req.params.id);

  const fichier = await prisma.fichier.findUnique({
    where: { id: fichierId },
    include: { dossier: true },
  });

  if (!fichier || fichier.supprime) {
    return res.status(404).json({ error: "Fichier introuvable." });
  }
  if (!peutAccederDossier(req.user, fichier.dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  if (!fs.existsSync(fichier.chemin)) {
    return res.status(410).json({ error: "Le fichier n'existe plus sur le serveur." });
  }

  return res.download(fichier.chemin, fichier.nom);
}

async function renommerFichier(req, res) {
  const fichierId = Number(req.params.id);
  const { nom } = req.body;

  if (!nom) return res.status(400).json({ error: "Nouveau nom requis." });

  const fichier = await prisma.fichier.findUnique({
    where: { id: fichierId },
    include: { dossier: true },
  });
  if (!fichier) return res.status(404).json({ error: "Fichier introuvable." });
  if (!peutAccederDossier(req.user, fichier.dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  const mis = await prisma.fichier.update({ where: { id: fichierId }, data: { nom } });

  await logAudit({
    userId: req.user.id,
    action: "RENAME_FILE",
    ressource: "Fichier",
    ressourceId: fichierId,
    details: `nouveauNom=${nom}`,
    ip: req.ip,
  });

  return res.json(mis);
}

/** Corbeille : liste tous les fichiers supprimés visibles par l'utilisateur. */
async function listerCorbeille(req, res) {
  const supprimes = await prisma.fichier.findMany({
    where: { supprime: true },
    include: { dossier: true, ajoutePar: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { dateAjout: "desc" },
  });

  const visibles = supprimes.filter((f) => peutAccederDossier(req.user, f.dossier));
  return res.json(visibles);
}

async function mettreALaCorbeille(req, res) {
  const fichierId = Number(req.params.id);

  const fichier = await prisma.fichier.findUnique({
    where: { id: fichierId },
    include: { dossier: true },
  });
  if (!fichier) return res.status(404).json({ error: "Fichier introuvable." });
  if (!peutAccederDossier(req.user, fichier.dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  await prisma.fichier.update({ where: { id: fichierId }, data: { supprime: true } });

  await logAudit({
    userId: req.user.id,
    action: "DELETE_FILE",
    ressource: "Fichier",
    ressourceId: fichierId,
    ip: req.ip,
  });

  return res.status(204).send();
}

async function restaurerFichier(req, res) {
  const fichierId = Number(req.params.id);

  const fichier = await prisma.fichier.findUnique({
    where: { id: fichierId },
    include: { dossier: true },
  });
  if (!fichier) return res.status(404).json({ error: "Fichier introuvable." });
  if (!peutAccederDossier(req.user, fichier.dossier)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  await prisma.fichier.update({ where: { id: fichierId }, data: { supprime: false } });

  await logAudit({
    userId: req.user.id,
    action: "RESTORE_FILE",
    ressource: "Fichier",
    ressourceId: fichierId,
    ip: req.ip,
  });

  return res.status(204).send();
}

module.exports = {
  listerFichiers,
  uploaderFichier,
  historiqueFichier,
  telechargerVersion,
  telechargerFichier,
  renommerFichier,
  listerCorbeille,
  mettreALaCorbeille,
  restaurerFichier,
};
