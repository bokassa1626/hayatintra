// ============================================================================
// Contrôleur Rapports d'activité — remplace les "feuilles de calcul
// individuelles" décrites au chapitre 1.3.3 du rapport par une consolidation
// automatique (Itération 6 du prompt maître).
// ============================================================================
const prisma = require("../config/prisma");
const { logAudit } = require("../services/audit.service");

async function creerRapport(req, res) {
  const { zone, date, description } = req.body;
  let { operateur } = req.body;

  if (!zone || !date || !description) {
    return res.status(400).json({ error: "zone, date et description sont requis." });
  }

  // Un technicien/chef de projet ne peut déclarer un rapport que pour son
  // propre opérateur (cloisonnement identique aux dossiers/fichiers).
  if (!["ADMIN", "COUNTRY_MANAGER"].includes(req.user.role)) {
    operateur = req.user.operateur;
  }
  if (!operateur || operateur === "AUCUN") {
    return res.status(400).json({ error: "Un opérateur valide est requis pour ce rapport." });
  }

  const rapport = await prisma.rapportActivite.create({
    data: {
      technicienId: req.user.id,
      operateur,
      zone,
      date: new Date(date),
      description,
    },
  });

  await logAudit({
    userId: req.user.id,
    action: "CREATE_RAPPORT",
    ressource: "RapportActivite",
    ressourceId: rapport.id,
    details: `operateur=${operateur} zone=${zone}`,
    ip: req.ip,
  });

  return res.status(201).json(rapport);
}

/** Mes propres rapports — accessible à tout utilisateur authentifié, sans
 * exiger la permission READ:RAPPORT (c'est sa propre donnée). */
async function mesRapports(req, res) {
  const rapports = await prisma.rapportActivite.findMany({
    where: { technicienId: req.user.id },
    orderBy: { date: "desc" },
  });
  return res.json(rapports);
}

/** Vue consolidée — remplace le suivi manuel en feuilles de calcul (chapitre
 * 1.3.3). Réservée aux rôles ayant READ:RAPPORT (managers, chefs de projet,
 * country manager, admin), avec cloisonnement par opérateur. */
async function listerRapports(req, res) {
  const where = {};

  if (!["ADMIN", "COUNTRY_MANAGER"].includes(req.user.role) && req.user.operateur !== "AUCUN") {
    where.operateur = req.user.operateur;
  }

  const rapports = await prisma.rapportActivite.findMany({
    where,
    include: { technicien: { select: { id: true, nom: true, prenom: true, operateur: true } } },
    orderBy: { date: "desc" },
  });

  return res.json(rapports);
}

/** Tableau de bord de consolidation : nombre d'interventions par opérateur et
 * par zone, pour la période demandée (par défaut les 30 derniers jours). */
async function consolidation(req, res) {
  const where = {};
  if (!["ADMIN", "COUNTRY_MANAGER"].includes(req.user.role) && req.user.operateur !== "AUCUN") {
    where.operateur = req.user.operateur;
  }

  const depuis = req.query.depuis ? new Date(req.query.depuis) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  where.date = { gte: depuis };

  const rapports = await prisma.rapportActivite.findMany({
    where,
    include: { technicien: { select: { nom: true, prenom: true } } },
  });

  const parOperateur = {};
  const parZone = {};
  const parTechnicien = {};

  for (const r of rapports) {
    parOperateur[r.operateur] = (parOperateur[r.operateur] || 0) + 1;
    parZone[r.zone] = (parZone[r.zone] || 0) + 1;
    const nomTech = `${r.technicien.prenom} ${r.technicien.nom}`;
    parTechnicien[nomTech] = (parTechnicien[nomTech] || 0) + 1;
  }

  return res.json({
    periode: { depuis, jusqu_a: new Date() },
    totalRapports: rapports.length,
    parOperateur,
    parZone,
    parTechnicien,
  });
}

module.exports = { creerRapport, mesRapports, listerRapports, consolidation };
