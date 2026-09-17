// ============================================================================
// Application Express — séparée de server.js pour pouvoir être testée avec
// supertest sans ouvrir de vrai port réseau ni démarrer Socket.IO.
// ============================================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const messageRoutes = require("./routes/message.routes");
const dossierRoutes = require("./routes/dossier.routes");
const fichierRoutes = require("./routes/fichier.routes");
const rapportRoutes = require("./routes/rapport.routes");
const auditRoutes = require("./routes/audit.routes");
const reseauRoutes = require("./routes/reseau.routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Émetteur temps réel "factice" par défaut (no-op), utilisé quand l'app
// tourne dans les tests (supertest, sans vrai serveur Socket.IO). En
// production, server.js remplace cet objet par la vraie instance Socket.IO
// via app.set("io", io) — voir src/server.js.
app.set("io", {
  to: () => ({ emit: () => {} }),
});

// Route de santé simple, utile pour vérifier que le serveur tourne (§7 du
// prompt maître : critère d'acceptation "le projet démarre").
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API HAYATCOM Intranet opérationnelle." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dossiers", dossierRoutes);
app.use("/api/fichiers", fichierRoutes);
app.use("/api/rapports", rapportRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reseau", reseauRoutes);

// Gestionnaire d'erreurs global — évite de faire fuiter la stack trace au client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

module.exports = app;
