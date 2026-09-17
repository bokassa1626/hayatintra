// ============================================================================
// Contrôleur Simulateur réseau — remplace le diagramme de déploiement réel
// (Fig. 3.3 du rapport) par une visualisation interactive, togglable pour la
// démonstration (Itération 5 du prompt maître, §2 principe "tout est simulé").
// Réservé à l'ADMIN (permission MANAGE:NOEUD_RESEAU).
// ============================================================================
const prisma = require("../config/prisma");
const { logAudit } = require("../services/audit.service");

async function listerNoeuds(req, res) {
  const noeuds = await prisma.noeudReseau.findMany({ orderBy: { id: "asc" } });
  return res.json(noeuds);
}

async function basculerActif(req, res) {
  const id = Number(req.params.id);
  const noeud = await prisma.noeudReseau.findUnique({ where: { id } });
  if (!noeud) return res.status(404).json({ error: "Nœud introuvable." });

  const misAJour = await prisma.noeudReseau.update({
    where: { id },
    data: { actif: !noeud.actif },
  });

  await logAudit({
    userId: req.user.id,
    action: misAJour.actif ? "NOEUD_RESEAU_ACTIVE" : "NOEUD_RESEAU_DESACTIVE",
    ressource: "NoeudReseau",
    ressourceId: id,
    details: noeud.nom,
    ip: req.ip,
  });

  return res.json(misAJour);
}

/** Métriques simulées (latence/débit fictifs) pour les nœuds actifs — purement
 * illustratif, clairement présenté comme tel côté frontend (§4 Itération 5). */
async function metriquesSimulees(req, res) {
  const noeuds = await prisma.noeudReseau.findMany();

  const metriques = noeuds.map((n) => ({
    noeudId: n.id,
    nom: n.nom,
    actif: n.actif,
    // Valeurs déterministes (dérivées de l'id) pour rester stables entre deux
    // appels, plutôt qu'aléatoires à chaque requête.
    latenceMs: n.actif ? 8 + ((n.id * 7) % 40) : null,
    debitMbps: n.actif ? 50 + ((n.id * 23) % 450) : null,
  }));

  return res.json({ genereLe: new Date(), simulation: true, metriques });
}

module.exports = { listerNoeuds, basculerActif, metriquesSimulees };
