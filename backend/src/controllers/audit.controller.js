// ============================================================================
// Contrôleur Journal d'audit — consultation filtrée + export CSV
// (Itération 4 du prompt maître, chapitre 2.2.4 / §2.3.1 du rapport)
// Réservé au rôle ADMIN (permission READ:AUDIT_LOG).
// ============================================================================
const prisma = require("../config/prisma");

function construireFiltre(query) {
  const where = {};

  if (query.userId) where.userId = Number(query.userId);
  if (query.action) where.action = query.action;
  if (query.dateDebut || query.dateFin) {
    where.dateAction = {};
    if (query.dateDebut) where.dateAction.gte = new Date(query.dateDebut);
    if (query.dateFin) where.dateAction.lte = new Date(query.dateFin);
  }

  return where;
}

async function listerAuditLogs(req, res) {
  const where = construireFiltre(req.query);

  const page = Number(req.query.page) || 1;
  const parPage = Number(req.query.parPage) || 50;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, nom: true, prenom: true, email: true } } },
      orderBy: { dateAction: "desc" },
      skip: (page - 1) * parPage,
      take: parPage,
    }),
  ]);

  return res.json({ total, page, parPage, logs });
}

/** Liste des types d'actions distincts déjà enregistrées — utile pour peupler
 * un filtre déroulant côté frontend sans avoir à les coder en dur. */
async function listerActionsDistinctes(req, res) {
  const resultats = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  });
  return res.json(resultats.map((r) => r.action));
}

async function exporterCSV(req, res) {
  const where = construireFiltre(req.query);

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { nom: true, prenom: true, email: true } } },
    orderBy: { dateAction: "desc" },
  });

  const entetes = ["Date", "Utilisateur", "Email", "Action", "Ressource", "RessourceId", "Details", "IP"];
  const lignes = logs.map((l) =>
    [
      l.dateAction.toISOString(),
      l.user ? `${l.user.prenom} ${l.user.nom}` : "Système",
      l.user?.email || "",
      l.action,
      l.ressource || "",
      l.ressourceId ?? "",
      (l.details || "").replace(/"/g, '""'),
      l.ip || "",
    ]
      .map((champ) => `"${champ}"`)
      .join(",")
  );

  const csv = [entetes.join(","), ...lignes].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="journal_audit_${Date.now()}.csv"`);
  return res.send(csv);
}

module.exports = { listerAuditLogs, listerActionsDistinctes, exporterCSV };
