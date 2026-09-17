// ============================================================================
// Compteur de messages non lus — alimenté au démarrage par un appel API, puis
// tenu à jour en temps réel par l'événement Socket.IO "nouveau_message".
// ============================================================================
import { defineStore } from "pinia";
import { messagerieService } from "../services/messagerie.service";
import { getSocket } from "../services/socket";

export const useMessagerieStore = defineStore("messagerie", {
  state: () => ({
    nonLus: 0,
    ecouteurAttache: false,
  }),

  actions: {
    async chargerCompteur() {
      const reception = await messagerieService.reception();
      this.nonLus = reception.filter((m) => !m.lu).length;
    },

    attacherEcouteurTempsReel() {
      if (this.ecouteurAttache) return;
      const socket = getSocket();
      if (!socket) return;

      socket.on("nouveau_message", () => {
        this.nonLus += 1;
      });
      this.ecouteurAttache = true;
    },

    reinitialiserApresLecture(nombreLus) {
      this.nonLus = Math.max(0, this.nonLus - nombreLus);
    },
  },
});
