// ============================================================================
// Client HTTP central — attache automatiquement l'access token, et le
// rafraîchit tout seul en cas d'expiration (SSO simulé, voir backend).
// ============================================================================
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({ baseURL: API_URL });

// Ces deux fonctions sont injectées par le store d'authentification pour
// éviter une dépendance circulaire (api.js <-> stores/auth.js).
let getAccessToken = () => null;
let onRefreshEchoue = () => {};
let rafraichirToken = async () => null;

export function configurerIntercepteurs({ getToken, onRefreshFail, refresh }) {
  getAccessToken = getToken;
  onRefreshEchoue = onRefreshFail;
  rafraichirToken = refresh;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let rafraichissementEnCours = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requeteOriginale = error.config;

    // 401 = access token expiré/invalide. On tente UNE fois de le rafraîchir
    // via le refresh token, puis on rejoue la requête originale.
    if (error.response?.status === 401 && !requeteOriginale._retry) {
      requeteOriginale._retry = true;

      try {
        // Mutualise les rafraîchissements simultanés (plusieurs requêtes en
        // parallèle ne déclenchent qu'un seul appel /auth/refresh).
        if (!rafraichissementEnCours) {
          rafraichissementEnCours = rafraichirToken();
        }
        const nouveauToken = await rafraichissementEnCours;
        rafraichissementEnCours = null;

        if (!nouveauToken) throw new Error("Rafraîchissement impossible");

        requeteOriginale.headers.Authorization = `Bearer ${nouveauToken}`;
        return api(requeteOriginale);
      } catch (err) {
        rafraichissementEnCours = null;
        onRefreshEchoue();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
