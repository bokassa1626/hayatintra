// ============================================================================
// Routeur — protège les pages selon la session (SSO) et, pour certaines,
// selon le rôle (RBAC côté UI ; le backend reste la source de vérité).
// ============================================================================
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/connexion",
    name: "connexion",
    component: () => import("../views/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("../layouts/AppLayout.vue"),
    children: [
      {
        path: "",
        name: "tableau-de-bord",
        component: () => import("../views/DashboardView.vue"),
      },
      {
        path: "messagerie",
        name: "messagerie",
        component: () => import("../views/MessagerieView.vue"),
      },
      {
        path: "fichiers",
        name: "fichiers",
        component: () => import("../views/FichiersView.vue"),
      },
      {
        path: "rapports",
        name: "rapports",
        component: () => import("../views/RapportsView.vue"),
      },
      {
        path: "reseau",
        name: "reseau",
        component: () => import("../views/ReseauView.vue"),
        meta: { roles: ["ADMIN"] },
      },
      {
        path: "utilisateurs",
        name: "utilisateurs",
        component: () => import("../views/UtilisateursView.vue"),
        meta: { roles: ["ADMIN"] },
      },
      {
        path: "audit",
        name: "audit",
        component: () => import("../views/AuditView.vue"),
        meta: { roles: ["ADMIN"] },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.public) {
    // Un utilisateur déjà connecté qui va sur /connexion est renvoyé au tableau de bord.
    if (auth.estConnecte) return { name: "tableau-de-bord" };
    return true;
  }

  if (!auth.estConnecte) {
    return { name: "connexion", query: { redirect: to.fullPath } };
  }

  if (to.meta.roles && !auth.aLeRole(to.meta.roles)) {
    return { name: "tableau-de-bord" };
  }

  return true;
});

export default router;
