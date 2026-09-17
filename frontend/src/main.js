import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "./assets/main.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

// On restaure la session (si un refresh token existe déjà) AVANT de monter
// l'app, pour éviter un flash de la page de connexion à chaque rechargement.
const auth = useAuthStore();
auth.initialiser().finally(() => {
  app.mount("#app");
});
