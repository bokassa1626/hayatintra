<template>
  <div class="flex min-h-screen bg-uni-surface">
    <div v-if="menuOuvert" class="fixed inset-0 z-30 bg-uni-navy/30 backdrop-blur-sm lg:hidden" @click="menuOuvert = false"></div>
    <!-- Navigation latérale -->
    <aside class="fixed inset-y-0 left-0 z-40 flex w-72 flex-shrink-0 flex-col border-r border-uni-border bg-white shadow-2xl transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 lg:shadow-none" :class="menuOuvert ? 'translate-x-0' : '-translate-x-full'">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-uni-purple text-white">
          <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-uni-navy leading-none">HAYATCOM</p>
          <p class="text-[10px] text-uni-muted leading-none mt-0.5">Intranet</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="mt-1 flex-1 space-y-0.5 px-3">
        <p class="uni-label px-2 pb-2 pt-3">Principal</p>
        <RouterLink
          v-for="item in navigationVisible.filter(i => !i.admin)"
          :key="item.nom"
          :to="{ name: item.nom }"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all"
          :class="estActif(item.nom) ? 'nav-link-actif' : 'nav-link-inactif'"
          @click="menuOuvert = false"
        >
          <component :is="item.icone" class="h-4 w-4 flex-shrink-0" />
          <span class="flex-1">{{ item.libelle }}</span>
          <span
            v-if="item.nom === 'messagerie' && messagerie.nonLus > 0"
            class="uni-badge uni-badge-purple !py-0.5 !px-1.5 text-[10px]"
          >{{ messagerie.nonLus }}</span>
        </RouterLink>

        <template v-if="navigationVisible.some(i => i.admin)">
          <p class="uni-label px-2 pb-2 pt-5">Administration</p>
          <RouterLink
            v-for="item in navigationVisible.filter(i => i.admin)"
            :key="item.nom"
            :to="{ name: item.nom }"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all"
            :class="estActif(item.nom) ? 'nav-link-actif' : 'nav-link-inactif'"
            @click="menuOuvert = false"
          >
            <component :is="item.icone" class="h-4 w-4 flex-shrink-0" />
            {{ item.libelle }}
          </RouterLink>
        </template>
      </nav>

      <!-- Profil utilisateur -->
      <div class="border-t border-uni-border p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-uni-purple/10 text-uni-purple text-sm font-bold">
            {{ initiales }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-uni-navy">{{ auth.user?.prenom }} {{ auth.user?.nom }}</p>
            <p class="truncate text-xs text-uni-muted">{{ auth.user?.role }}</p>
          </div>
        </div>
        <button
          class="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-uni-muted transition-all hover:bg-red-50 hover:text-red-600"
          @click="seDeconnecter"
        >
          <LogOut class="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- Zone principale -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="flex h-[4.25rem] items-center justify-between border-b border-uni-border bg-white px-4 sm:px-6">
        <div class="flex items-center gap-2">
          <button class="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-xl text-uni-muted transition-colors hover:bg-uni-surface hover:text-uni-navy lg:hidden" aria-label="Ouvrir le menu" @click="menuOuvert = true">
            <Menu class="h-5 w-5" />
          </button>
          <span class="text-sm text-uni-muted">{{ formaterDirection(auth.user?.direction) }}</span>
          <span v-if="auth.user?.operateur && auth.user.operateur !== 'AUCUN'" class="uni-badge uni-badge-purple">
            {{ auth.user.operateur }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-uni-green animate-pulse"></span>
          <span class="text-xs text-uni-muted">Session active</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard, Mail, FolderOpen, ClipboardList, Radio, Users, ShieldCheck, LogOut, Menu } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";
import { useMessagerieStore } from "../stores/messagerie";

const auth = useAuthStore();
const messagerie = useMessagerieStore();
const route = useRoute();
const router = useRouter();
const menuOuvert = ref(false);

const NAVIGATION = [
  { nom: "tableau-de-bord", libelle: "Tableau de bord", icone: LayoutDashboard },
  { nom: "messagerie", libelle: "Messagerie", icone: Mail },
  { nom: "fichiers", libelle: "Fichiers", icone: FolderOpen },
  { nom: "rapports", libelle: "Rapports", icone: ClipboardList },
  { nom: "reseau", libelle: "Réseau", icone: Radio, roles: ["ADMIN"], admin: true },
  { nom: "utilisateurs", libelle: "Utilisateurs", icone: Users, roles: ["ADMIN"], admin: true },
  { nom: "audit", libelle: "Journal d'audit", icone: ShieldCheck, roles: ["ADMIN"], admin: true },
];

const navigationVisible = computed(() => NAVIGATION.filter(i => !i.roles || auth.aLeRole(i.roles)));
const estActif = (nom) => route.name === nom;
const initiales = computed(() => `${auth.user?.prenom?.[0] || ""}${auth.user?.nom?.[0] || ""}`.toUpperCase());

function formaterDirection(d) {
  return d ? d.replaceAll("_", " ") : "";
}

async function seDeconnecter() {
  await auth.deconnecter();
  router.push({ name: "connexion" });
}

onMounted(() => {
  messagerie.chargerCompteur();
  messagerie.attacherEcouteurTempsReel();
});
</script>
