// ============================================================================
// Store d'authentification — un seul point de vérité pour la session
// (SSO simulé : tout le reste de l'app dépend de ce store).
// ============================================================================
import { defineStore } from "pinia";
import api, { configurerIntercepteurs } from "../services/api";
import { connecterSocket, deconnecterSocket } from "../services/socket";

const CLE_REFRESH = "hayatcom_refresh_token";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: null,
    user: null, // { id, nom, prenom, email, role, direction, operateur }
    chargementInitial: true,
  }),

  getters: {
    estConnecte: (state) => !!state.accessToken && !!state.user,
    // Permet aux composants de faire v-if="auth.aLeRole('ADMIN')" simplement.
    aLeRole: (state) => (roles) => {
      const liste = Array.isArray(roles) ? roles : [roles];
      return state.user ? liste.includes(state.user.role) : false;
    },
  },

  actions: {
    /** À appeler une seule fois, au démarrage de l'application. */
    async initialiser() {
      configurerIntercepteurs({
        getToken: () => this.accessToken,
        onRefreshFail: () => this.deconnecter(),
        refresh: () => this.rafraichir(),
      });

      const refreshToken = localStorage.getItem(CLE_REFRESH);
      if (refreshToken) {
        const token = await this.rafraichir();
        if (token) {
          await this.chargerProfil();
        }
      }
      this.chargementInitial = false;
    },

    async connecter(email, motDePasse) {
      const { data } = await api.post("/auth/login", { email, motDePasse });
      this.accessToken = data.accessToken;
      this.user = data.user;
      localStorage.setItem(CLE_REFRESH, data.refreshToken);
      connecterSocket(this.accessToken);
      return data.user;
    },

    async rafraichir() {
      const refreshToken = localStorage.getItem(CLE_REFRESH);
      if (!refreshToken) return null;

      try {
        const { data } = await api.post("/auth/refresh", { refreshToken });
        this.accessToken = data.accessToken;
        connecterSocket(this.accessToken);
        return data.accessToken;
      } catch {
        localStorage.removeItem(CLE_REFRESH);
        return null;
      }
    },

    async chargerProfil() {
      const { data } = await api.get("/auth/me");
      this.user = data.user;
    },

    async deconnecter() {
      const refreshToken = localStorage.getItem(CLE_REFRESH);
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // on déconnecte localement même si l'appel réseau échoue
      }
      localStorage.removeItem(CLE_REFRESH);
      this.accessToken = null;
      this.user = null;
      deconnecterSocket();
    },
  },
});
