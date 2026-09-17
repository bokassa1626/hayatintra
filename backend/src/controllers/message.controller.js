// ============================================================================
// Contrôleur Messagerie interne — simule Postfix (envoi/relais) + Dovecot
// (consultation IMAP) via base de données + Socket.IO, voir chapitre 2.2.2
// du rapport et §4 Itération 2 du prompt maître.
// ============================================================================
const fs = require("fs");
const prisma = require("../config/prisma");
const { logAudit } = require("../services/audit.service");

/** Annuaire interne — sert à choisir les destinataires (remplace le LDAP réel). */
async function annuaire(req, res) {
  const users = await prisma.user.findMany({
    where: { actif: true, id: { not: req.user.id } },
    select: { id: true, nom: true, prenom: true, email: true, direction: true, operateur: true },
    orderBy: [{ nom: "asc" }],
  });
  return res.json(users);
}

async function envoyerMessage(req, res) {
  const { sujet, corps } = req.body;
  let { destinataireIds } = req.body;

  // Les champs multipart/form-data arrivent en string : on tolère les deux formats.
  if (typeof destinataireIds === "string") {
    try {
      destinataireIds = JSON.parse(destinataireIds);
    } catch {
      destinataireIds = [destinataireIds];
    }
  }

  if (!sujet || !corps || !Array.isArray(destinataireIds) || destinataireIds.length === 0) {
    return res.status(400).json({ error: "sujet, corps et au moins un destinataire sont requis." });
  }

  const destinatairesValides = await prisma.user.findMany({
    where: { id: { in: destinataireIds.map(Number) }, actif: true },
    select: { id: true },
  });

  if (destinatairesValides.length === 0) {
    return res.status(400).json({ error: "Aucun destinataire valide." });
  }

  const fichiersJoints = (req.files || []).map((f) => ({
    nomFichier: f.originalname,
    chemin: f.path,
    taille: f.size,
    type: f.mimetype,
  }));

  const message = await prisma.message.create({
    data: {
      expediteurId: req.user.id,
      sujet,
      corps,
      // Statut REMIS directement : dans notre simulation (tout est local à
      // l'application, contrairement à un vrai relais Postfix), la remise
      // est instantanée dès l'enregistrement en base.
      statut: "REMIS",
      destinataires: {
        create: destinatairesValides.map((d) => ({ destinataireId: d.id })),
      },
      piecesJointes: { create: fichiersJoints },
    },
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true, email: true } },
      destinataires: { include: { destinataire: { select: { id: true, nom: true, prenom: true } } } },
      piecesJointes: true,
    },
  });

  await logAudit({
    userId: req.user.id,
    action: "SEND_MESSAGE",
    ressource: "Message",
    ressourceId: message.id,
    details: `destinataires=${destinatairesValides.map((d) => d.id).join(",")}`,
    ip: req.ip,
  });

  // Notification temps réel à chaque destinataire connecté (remplace la
  // notification "nouveau mail" d'un client IMAP).
  const io = req.app.get("io");
  for (const d of destinatairesValides) {
    io.to(`user:${d.id}`).emit("nouveau_message", {
      id: message.id,
      sujet: message.sujet,
      expediteur: message.expediteur,
      dateEnvoi: message.dateEnvoi,
    });
  }

  return res.status(201).json(message);
}

async function reception(req, res) {
  const entrees = await prisma.messageDestinataire.findMany({
    where: { destinataireId: req.user.id, supprimeDest: false },
    include: {
      message: {
        include: {
          expediteur: { select: { id: true, nom: true, prenom: true, email: true } },
          piecesJointes: true,
        },
      },
    },
    orderBy: { message: { dateEnvoi: "desc" } },
  });

  return res.json(
    entrees.map((e) => ({
      entreeId: e.id,
      lu: e.lu,
      dateLecture: e.dateLecture,
      ...e.message,
    }))
  );
}

async function envoyes(req, res) {
  const messages = await prisma.message.findMany({
    where: { expediteurId: req.user.id, supprimeExp: false },
    include: {
      destinataires: { include: { destinataire: { select: { id: true, nom: true, prenom: true } } } },
      piecesJointes: true,
    },
    orderBy: { dateEnvoi: "desc" },
  });

  return res.json(messages);
}

async function lireMessage(req, res) {
  const messageId = Number(req.params.id);

  const entree = await prisma.messageDestinataire.findUnique({
    where: { messageId_destinataireId: { messageId, destinataireId: req.user.id } },
    include: {
      message: {
        include: {
          expediteur: { select: { id: true, nom: true, prenom: true, email: true } },
          piecesJointes: true,
        },
      },
    },
  });

  if (!entree) {
    return res.status(404).json({ error: "Message introuvable." });
  }

  if (!entree.lu) {
    await prisma.messageDestinataire.update({
      where: { id: entree.id },
      data: { lu: true, dateLecture: new Date() },
    });

    // On vérifie si TOUS les destinataires ont lu pour passer le statut global à "LU".
    const tousLus = await prisma.messageDestinataire.findMany({ where: { messageId } });
    if (tousLus.every((d) => d.lu || d.id === entree.id)) {
      await prisma.message.update({ where: { id: messageId }, data: { statut: "LU" } });
    }
  }

  return res.json(entree.message);
}

async function supprimerMessage(req, res) {
  const messageId = Number(req.params.id);

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) {
    return res.status(404).json({ error: "Message introuvable." });
  }

  if (message.expediteurId === req.user.id) {
    await prisma.message.update({ where: { id: messageId }, data: { supprimeExp: true } });
  } else {
    await prisma.messageDestinataire.updateMany({
      where: { messageId, destinataireId: req.user.id },
      data: { supprimeDest: true },
    });
  }

  await logAudit({
    userId: req.user.id,
    action: "DELETE_MESSAGE",
    ressource: "Message",
    ressourceId: messageId,
    ip: req.ip,
  });

  return res.status(204).send();
}

async function telechargerPieceJointe(req, res) {
  const pieceId = Number(req.params.id);

  const piece = await prisma.pieceJointe.findUnique({
    where: { id: pieceId },
    include: { message: { include: { destinataires: true } } },
  });

  if (!piece || !piece.message) {
    return res.status(404).json({ error: "Pièce jointe introuvable." });
  }

  // Seuls l'expéditeur ou un destinataire du message peuvent télécharger.
  const estAutorise =
    piece.message.expediteurId === req.user.id ||
    piece.message.destinataires.some((d) => d.destinataireId === req.user.id);

  if (!estAutorise) {
    return res.status(403).json({ error: "Accès refusé à cette pièce jointe." });
  }

  if (!fs.existsSync(piece.chemin)) {
    return res.status(410).json({ error: "Le fichier n'existe plus sur le serveur." });
  }

  return res.download(piece.chemin, piece.nomFichier);
}

module.exports = {
  annuaire,
  envoyerMessage,
  reception,
  envoyes,
  lireMessage,
  supprimerMessage,
  telechargerPieceJointe,
};
