// ============================================================================
// Point d'entrée du serveur — HTTP + Socket.IO (Socket.IO sera pleinement
// utilisé à l'Itération 2 pour la messagerie interne en temps réel).
// ============================================================================
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { socketAuthMiddleware, joinPersonalRoom } = require("./middleware/socketAuth");

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// SSO simulé étendu au temps réel : même token JWT que l'API REST.
io.use(socketAuthMiddleware);

io.on("connection", async (socket) => {
  console.log(`[socket] Utilisateur ${socket.userId} connecté (${socket.id})`);
  await joinPersonalRoom(socket);

  socket.on("disconnect", () => {
    console.log(`[socket] Utilisateur ${socket.userId} déconnecté (${socket.id})`);
  });
});

// Rendu disponible pour les contrôleurs futurs (ex: émettre un événement
// "nouveau_message" depuis message.controller.js à l'Itération 2).
app.set("io", io);

server.listen(PORT, () => {
  console.log(`✅ Serveur HAYATCOM Intranet démarré sur http://localhost:${PORT}`);
  console.log(`   Test rapide : http://localhost:${PORT}/api/health`);
});
