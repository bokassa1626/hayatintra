// ============================================================================
// Contrôleur Admin — gestion des utilisateurs et des rôles
// (Itération 1 du prompt maître : « Page d'administration des utilisateurs »)
// Toutes ces routes sont protégées par checkPermission("MANAGE", "USER").
// ============================================================================
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { logAudit } = require("../services/audit.service");
const { revokeAllUserTokens } = require("../services/token.service");

async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    include: { role: true, manager: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { id: "asc" },
  });

  return res.json(
    users.map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: u.role.nom,
      direction: u.direction,
      operateur: u.operateur,
      actif: u.actif,
      manager: u.manager,
      derniereConnexion: u.derniereConnexion,
    }))
  );
}

async function createUser(req, res) {
  const { nom, prenom, email, motDePasse, roleNom, direction, operateur, managerId } = req.body;

  if (!nom || !prenom || !email || !motDePasse || !roleNom || !direction) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  const role = await prisma.role.findUnique({ where: { nom: roleNom } });
  if (!role) {
    return res.status(400).json({ error: `Rôle inconnu : ${roleNom}` });
  }

  const motDePasseHash = await bcrypt.hash(motDePasse, 10);

  try {
    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        motDePasseHash,
        roleId: role.id,
        direction,
        operateur: operateur || "AUCUN",
        managerId: managerId || null,
      },
    });

    await logAudit({
      userId: req.user.id,
      action: "CREATE_USER",
      ressource: "User",
      ressourceId: user.id,
      details: `email=${email} role=${roleNom}`,
      ip: req.ip,
    });

    return res.status(201).json({ id: user.id });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà." });
    }
    throw err;
  }
}

async function updateUserRole(req, res) {
  const userId = Number(req.params.id);
  const { roleNom } = req.body;

  const role = await prisma.role.findUnique({ where: { nom: roleNom } });
  if (!role) {
    return res.status(400).json({ error: `Rôle inconnu : ${roleNom}` });
  }

  await prisma.user.update({ where: { id: userId }, data: { roleId: role.id } });

  // On révoque les sessions actives : le changement de rôle doit prendre
  // effet immédiatement, pas seulement au prochain refresh token.
  await revokeAllUserTokens(userId);

  await logAudit({
    userId: req.user.id,
    action: "CHANGE_ROLE",
    ressource: "User",
    ressourceId: userId,
    details: `nouveauRole=${roleNom}`,
    ip: req.ip,
  });

  return res.status(204).send();
}

async function toggleActif(req, res) {
  const userId = Number(req.params.id);
  const { actif } = req.body;

  await prisma.user.update({ where: { id: userId }, data: { actif } });

  if (!actif) {
    await revokeAllUserTokens(userId);
  }

  await logAudit({
    userId: req.user.id,
    action: actif ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    ressource: "User",
    ressourceId: userId,
    ip: req.ip,
  });

  return res.status(204).send();
}

module.exports = { listUsers, createUser, updateUserRole, toggleActif };
