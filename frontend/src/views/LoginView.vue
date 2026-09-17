<template>
  <div class="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px]">
    <!-- Panneau visuel de marque -->
    <div class="relative hidden overflow-hidden bg-uni-navy lg:flex lg:flex-col">
      <div class="absolute inset-0 overflow-hidden">
        <svg viewBox="0 0 800 600" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="glow1" cx="30%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.42"/>
              <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="glow2" cx="70%" cy="70%" r="50%">
              <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="#06B6D4" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="600" fill="#13213C"/>
          <ellipse cx="240" cy="240" rx="350" ry="350" fill="url(#glow1)"/>
          <ellipse cx="560" cy="420" rx="280" ry="280" fill="url(#glow2)"/>
          <!-- Grille de points -->
          <g fill="#60A5FA" opacity="0.16">
            <circle v-for="(_, i) in Array(80)" :key="i"
              :cx="(i % 10) * 80 + 40" :cy="Math.floor(i/10)*80+40" r="2"/>
          </g>
          <!-- Nœuds d'opérateurs interconnectés -->
          <g>
            <line x1="400" y1="300" x2="200" y2="180" stroke="#60A5FA" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
            <line x1="400" y1="300" x2="600" y2="180" stroke="#60A5FA" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
            <line x1="400" y1="300" x2="180" y2="400" stroke="#60A5FA" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
            <line x1="400" y1="300" x2="620" y2="400" stroke="#60A5FA" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
            <line x1="400" y1="300" x2="400" y2="120" stroke="#60A5FA" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
            <!-- Hub central -->
            <circle cx="400" cy="300" r="42" fill="#2563EB" opacity="0.95"/>
            <text x="400" y="296" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="white">HTC</text>
            <text x="400" y="314" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="white" opacity="0.7">HAYATCOM</text>
            <!-- Opérateurs -->
            <g font-family="Inter,sans-serif" font-size="11" fill="white" font-weight="600">
              <circle cx="200" cy="180" r="26" fill="#22355D" stroke="#60A5FA" stroke-width="1.5"/>
              <text x="200" y="184" text-anchor="middle" fill="white">AIRTEL</text>
              <circle cx="600" cy="180" r="26" fill="#22355D" stroke="#60A5FA" stroke-width="1.5"/>
              <text x="600" y="184" text-anchor="middle" fill="white">VOD</text>
              <circle cx="180" cy="400" r="26" fill="#22355D" stroke="#60A5FA" stroke-width="1.5"/>
              <text x="180" y="404" text-anchor="middle" fill="white">ORG</text>
              <circle cx="620" cy="400" r="26" fill="#22355D" stroke="#60A5FA" stroke-width="1.5"/>
              <text x="620" y="404" text-anchor="middle" fill="white">RCS</text>
              <circle cx="400" cy="120" r="26" fill="#22355D" stroke="#60A5FA" stroke-width="1.5"/>
              <text x="400" y="124" text-anchor="middle" fill="white">FUEL</text>
            </g>
          </g>
        </svg>
      </div>

      <div class="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-16">
        <div>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-uni-purple">
              <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" stroke="white" stroke-width="2.5">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </div>
            <span class="text-xl font-bold text-white">HAYATCOM</span>
          </div>
          <p class="mt-2 text-sm text-white/60">Plateforme intranet sécurisée</p>
        </div>

        <div>
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Un espace, toutes vos opérations</p>
          <h2 class="text-4xl font-bold text-white leading-[1.12] tracking-tight">
            Connectez vos équipes.<br/>Protégez vos données.
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-white/60">
            Messagerie interne, partage de fichiers et suivi des interventions,
            cloisonnés par opérateur pour les équipes Managed Services.
          </p>
          <div class="mt-8 flex flex-wrap gap-2">
            <span v-for="op in ['AIRTEL','VODACOM','ORANGE','RCS','FUEL']" :key="op"
              class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              {{ op }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulaire de connexion -->
    <div class="relative flex items-center justify-center overflow-hidden bg-uni-surface px-6 py-10 sm:px-10">
      <div class="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-uni-purple/10 blur-3xl"></div>
      <div class="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"></div>
      <div class="relative w-full max-w-sm">
        <div class="mb-8 lg:hidden flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-uni-purple text-white">
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <span class="text-xl font-bold text-uni-navy">HAYATCOM</span>
        </div>

        <div class="uni-card p-7 sm:p-8">
          <div class="mb-7">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-uni-purple">Espace sécurisé</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-uni-navy">Bon retour parmi nous</h1>
            <p class="mt-2 text-sm leading-relaxed text-uni-muted">Connectez-vous avec vos identifiants internes HAYATCOM.</p>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="soumettre">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-uni-navy">Adresse email</label>
              <input v-model="email" type="email" autocomplete="username" required class="champ"
                placeholder="prenom.nom@hayatcom.cd"/>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-uni-navy">Mot de passe</label>
              <input v-model="motDePasse" type="password" autocomplete="current-password" required class="champ"
                placeholder="••••••••"/>
            </div>

            <div v-if="erreur" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ erreur }}
            </div>

            <button type="submit" class="bouton-primaire mt-2 w-full py-3" :disabled="enCours">
              <span v-if="enCours" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              {{ enCours ? "Connexion…" : "Se connecter" }}
            </button>
          </form>

        </div>
        <p class="mt-5 flex items-center justify-center gap-2 text-center text-xs text-uni-muted">
          <span class="h-1.5 w-1.5 rounded-full bg-uni-green"></span>
          Accès réservé aux collaborateurs autorisés
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const email = ref("");
const motDePasse = ref("");
const erreur = ref("");
const enCours = ref(false);
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

async function soumettre() {
  erreur.value = "";
  enCours.value = true;
  try {
    await auth.connecter(email.value, motDePasse.value);
    router.push(route.query.redirect || { name: "tableau-de-bord" });
  } catch (err) {
    erreur.value = err.response?.data?.error || "Identifiants invalides.";
  } finally {
    enCours.value = false;
  }
}
</script>
