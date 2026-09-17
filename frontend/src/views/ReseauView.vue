<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-uni-navy">Simulateur de réseau</h1>
        <p class="mt-1 text-sm text-uni-muted">
          Représentation visuelle du diagramme de déploiement (Figure 3.3 du rapport).
          Tous les nœuds sont simulés dans l'application — aucun matériel physique requis.
        </p>
      </div>
      <span class="uni-badge uni-badge-info">SIMULATION</span>
    </div>

    <!-- Diagramme SVG interactif -->
    <div class="uni-card mt-6 overflow-hidden p-0">
      <div class="border-b border-uni-border bg-uni-surface px-5 py-3 flex items-center justify-between">
        <p class="text-sm font-semibold text-uni-navy">Topologie de déploiement</p>
        <div class="flex items-center gap-4 text-xs text-uni-muted">
          <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-uni-green"></span>Actif</span>
          <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-uni-red"></span>Inactif</span>
        </div>
      </div>

      <div class="relative bg-[#F7F8FC] p-6">
        <svg viewBox="0 0 760 420" class="w-full max-w-3xl mx-auto" style="min-height:320px">
          <!-- Connexions -->
          <g stroke="#C5C8D8" stroke-width="1.5" stroke-dasharray="4 3" fill="none">
            <line x1="120" y1="210" x2="280" y2="210" />
            <line x1="380" y1="210" x2="530" y2="120" />
            <line x1="380" y1="210" x2="530" y2="210" />
            <line x1="380" y1="210" x2="530" y2="300" />
          </g>

          <!-- Nœud : Client Web -->
          <g @click="toggleNoeud(0)" class="cursor-pointer" style="user-select:none">
            <rect x="30" y="170" width="160" height="80" rx="12" :fill="noeuds[0]?.actif ? '#EEF0FB' : '#F2F2F4'" stroke="#C5C8D8" stroke-width="1.5" />
            <circle cx="170" cy="178" r="6" :fill="noeuds[0]?.actif ? '#22C55E' : '#EF4444'" />
            <text x="110" y="207" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#1E2A4A">Client Web</text>
            <text x="110" y="224" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#7B8497">Vue.js / Navigateur</text>
            <text x="110" y="239" text-anchor="middle" font-family="Inter, sans-serif" font-size="8" fill="#9B9FC0" font-style="italic">Cliquer pour toggler</text>
          </g>

          <!-- Flèches centrales -->
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
              <path d="M0,0 L0,4 L7,2 z" fill="#8B92B3" />
            </marker>
          </defs>
          <line x1="196" y1="210" x2="273" y2="210" stroke="#8B92B3" stroke-width="1.5" marker-end="url(#arrow)" />
          <line x1="373" y1="206" x2="303" y2="206" stroke="#8B92B3" stroke-width="1.5" marker-end="url(#arrow)" />
          <text x="234" y="204" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#8B92B3">HTTP/WS</text>

          <!-- Nœud : Serveur Applicatif (hub central) -->
          <g @click="toggleNoeud(1)" class="cursor-pointer" style="user-select:none">
            <rect x="278" y="155" width="180" height="110" rx="14" :fill="noeuds[1]?.actif ? '#EEF0FB' : '#F2F2F4'" stroke="#7B61FF" stroke-width="2" />
            <circle cx="445" cy="164" r="6" :fill="noeuds[1]?.actif ? '#22C55E' : '#EF4444'" />
            <text x="368" y="200" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#1E2A4A">Serveur Applicatif</text>
            <text x="368" y="218" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7B61FF" font-weight="600">Node.js / Express</text>
            <text x="368" y="234" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7B8497">API REST + Socket.IO</text>
            <text x="368" y="249" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#9B9FC0" font-style="italic">Hub central HAYATCOM</text>
          </g>

          <!-- Nœud : Serveur Mail simulé -->
          <g @click="toggleNoeud(2)" class="cursor-pointer" style="user-select:none">
            <rect x="530" y="75" width="190" height="90" rx="12" :fill="noeuds[2]?.actif ? '#EEF0FB' : '#F2F2F4'" stroke="#C5C8D8" stroke-width="1.5" />
            <circle cx="707" cy="84" r="6" :fill="noeuds[2]?.actif ? '#22C55E' : '#EF4444'" />
            <text x="625" y="113" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#1E2A4A">Serveur Mail</text>
            <text x="625" y="129" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7B8497">Simulation SMTP/IMAP</text>
            <text x="625" y="144" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#F97316" font-style="italic">(remplace Postfix/Dovecot)</text>
          </g>

          <!-- Nœud : Serveur Fichiers simulé -->
          <g @click="toggleNoeud(3)" class="cursor-pointer" style="user-select:none">
            <rect x="530" y="170" width="190" height="90" rx="12" :fill="noeuds[3]?.actif ? '#EEF0FB' : '#F2F2F4'" stroke="#C5C8D8" stroke-width="1.5" />
            <circle cx="707" cy="179" r="6" :fill="noeuds[3]?.actif ? '#22C55E' : '#EF4444'" />
            <text x="625" y="208" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#1E2A4A">Serveur Fichiers</text>
            <text x="625" y="224" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7B8497">Simulation Samba/SMB</text>
            <text x="625" y="239" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#F97316" font-style="italic">(remplace Samba/CIFS)</text>
          </g>

          <!-- Nœud : Base de données -->
          <g @click="toggleNoeud(4)" class="cursor-pointer" style="user-select:none">
            <rect x="530" y="265" width="190" height="90" rx="12" :fill="noeuds[4]?.actif ? '#EEF0FB' : '#F2F2F4'" stroke="#C5C8D8" stroke-width="1.5" />
            <circle cx="707" cy="274" r="6" :fill="noeuds[4]?.actif ? '#22C55E' : '#EF4444'" />
            <text x="625" y="305" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#1E2A4A">Base de données</text>
            <text x="625" y="321" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#7B8497">MySQL — via Prisma ORM</text>
            <text x="625" y="336" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#22C55E" font-style="italic">données réelles</text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Tableau des nœuds -->
    <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(noeud, i) in noeuds"
        :key="noeud.id"
        class="uni-card p-4 cursor-pointer transition-all hover:shadow-md"
        :class="noeud.actif ? 'border-l-4 border-l-uni-purple' : 'border-l-4 border-l-uni-muted/30 opacity-60'"
        @click="toggleNoeud(i)"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-uni-navy">{{ noeud.nom }}</p>
            <p class="mt-0.5 text-xs text-uni-muted">{{ typeLabel(noeud.type) }}</p>
          </div>
          <span
            class="mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="noeud.actif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
          >
            {{ noeud.actif ? "Actif" : "Inactif" }}
          </span>
        </div>
        <p v-if="noeud.description" class="mt-2 text-xs text-uni-muted italic">{{ noeud.description }}</p>
        <p class="mt-3 text-xs text-uni-muted">Cliquez pour simuler un arrêt/démarrage</p>
      </div>
    </div>

    <!-- Note de simulation -->
    <div class="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
      <p class="text-sm font-semibold text-orange-800">Rappel — Simulation logicielle</p>
      <p class="mt-1 text-xs text-orange-700 leading-relaxed">
        Tous les nœuds de ce diagramme sont simulés à l'intérieur d'un seul processus Node.js.
        Le toggling actif/inactif est purement illustratif pour la démonstration. En production
        avec budget, chaque nœud serait remplacé par un vrai serveur dédié (Postfix pour le mail,
        Samba pour les fichiers, MySQL sur une VM séparée), et les connexions représentées en
        pointillés deviendraient de vraies connexions réseau TCP/IP.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";

const noeuds = ref([]);

const TYPE_LABELS = {
  CLIENT: "Poste client (navigateur)",
  APP_SERVER: "Serveur applicatif",
  MAIL_SERVER: "Serveur mail (simulé)",
  FILE_SERVER: "Serveur fichiers (simulé)",
  DB_SERVER: "Serveur base de données",
};

function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

async function charger() {
  const { data } = await api.get("/reseau/noeuds");
  noeuds.value = data;
}

async function toggleNoeud(index) {
  const n = noeuds.value[index];
  if (!n) return;
  const { data } = await api.patch(`/reseau/noeuds/${n.id}`);
  // Le serveur fait le toggle et renvoie l'état mis à jour
  noeuds.value[index] = data;
}

onMounted(charger);
</script>
