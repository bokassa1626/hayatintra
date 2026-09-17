// ============================================================================
// Connexion Socket.IO — authentifiée avec le même access token JWT que l'API
// REST (voir backend/src/middleware/socketAuth.js).
// ============================================================================
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socket = null;

export function connecterSocket(accessToken) {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    autoConnect: true,
  });

  return socket;
}

export function deconnecterSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
