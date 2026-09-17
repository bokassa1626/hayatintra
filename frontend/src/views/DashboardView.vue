<template>
  <div>
    <!-- Entête de bienvenue -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-uni-navy">
        Bonjour, {{ auth.user?.prenom }} 👋
      </h1>
      <p class="mt-1 text-uni-muted">Bienvenue sur votre espace de travail HAYATCOM.</p>
    </div>

    <!-- Bannière info opérateur -->
    <div v-if="auth.user?.operateur && auth.user.operateur !== 'AUCUN'"
      class="mb-6 flex items-center gap-4 rounded-2xl border border-uni-purple/20 bg-uni-purple/5 px-5 py-4">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-uni-purple/10 text-uni-purple">
        <Radio class="h-5 w-5" />
      </div>
      <div>
        <p class="text-sm font-semibold text-uni-navy">Opérateur : {{ auth.user.operateur }}</p>
        <p class="text-xs text-uni-muted">Vos données sont cloisonnées à cet opérateur.</p>
      </div>
    </div>

    <!-- Raccourcis modules -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="r in raccourcisVisibles" :key="r.nom"
        :to="{ name: r.nom }"
        class="uni-card group flex flex-col gap-4 p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
      >
        <div class="flex items-center justify-between">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="r.couleur">
            <component :is="r.icone" class="h-5 w-5" />
          </div>
          <span class="uni-badge" :class="r.badge">{{ r.tag }}</span>
        </div>
        <div>
          <p class="font-semibold text-uni-navy">{{ r.titre }}</p>
          <p class="mt-1 text-sm text-uni-muted leading-relaxed">{{ r.description }}</p>
        </div>
      </RouterLink>
    </div>

    <!-- Note prototype -->
    <div class="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-amber-800">Prototype 100 % web — réseau simulé</p>
          <p class="mt-1 text-sm text-amber-700 leading-relaxed">
            La messagerie, le partage de fichiers et la topologie réseau sont simulés dans
            l'application (aucun matériel réseau requis). Le cloisonnement des données par
            opérateur est appliqué exactement comme en conditions réelles.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Mail, FolderOpen, ClipboardList, Radio, Users, ShieldCheck } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const RACCOURCIS = [
  { nom: "messagerie", titre: "Messagerie", tag: "Actif", description: "Consultez et envoyez des messages internes en temps réel.", icone: Mail, couleur: "bg-uni-purple/10 text-uni-purple", badge: "uni-badge-purple" },
  { nom: "fichiers", titre: "Fichiers", tag: "Actif", description: "Partagez et gérez vos documents avec versionnage automatique.", icone: FolderOpen, couleur: "bg-blue-50 text-blue-600", badge: "uni-badge-info" },
  { nom: "rapports", titre: "Rapports FME", tag: "Actif", description: "Déclarez vos interventions terrain et consultez le tableau de bord.", icone: ClipboardList, couleur: "bg-green-50 text-green-600", badge: "uni-badge-green" },
  { nom: "reseau", titre: "Réseau", tag: "Admin", description: "Visualisez la topologie de déploiement de la plateforme.", icone: Radio, couleur: "bg-orange-50 text-orange-600", badge: "uni-badge-amber", roles: ["ADMIN"] },
  { nom: "utilisateurs", titre: "Utilisateurs", tag: "Admin", description: "Gérez les comptes, rôles et l'organigramme HAYATCOM.", icone: Users, couleur: "bg-rose-50 text-rose-600", badge: "uni-badge-red", roles: ["ADMIN"] },
  { nom: "audit", titre: "Journal d'audit", tag: "Admin", description: "Traçabilité complète des actions sensibles avec export CSV.", icone: ShieldCheck, couleur: "bg-slate-50 text-slate-600", badge: "uni-badge-gray", roles: ["ADMIN"] },
];

const raccourcisVisibles = computed(() => RACCOURCIS.filter(r => !r.roles || auth.aLeRole(r.roles)));
</script>
