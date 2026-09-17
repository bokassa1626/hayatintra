<template>
  <div>
    <h1 class="text-2xl font-semibold text-uni-navy">Rapports d'activité</h1>
    <p class="mt-1 text-sm text-uni-muted">
      Déclarez vos interventions terrain ; les managers disposent d'une vue consolidée automatique.
    </p>

    <div class="mt-6 grid grid-cols-1 gap-6" :class="peutConsulter ? 'lg:grid-cols-[380px_1fr]' : ''">
      <!-- Formulaire de déclaration -->
      <div class="uni-card p-5">
        <p class="uni-label mb-3">Nouvelle intervention</p>
        <form class="space-y-4" @submit.prevent="soumettre">
          <div v-if="auth.aLeRole(['ADMIN', 'COUNTRY_MANAGER'])">
            <label class="mb-1 block text-sm font-medium text-uni-navy">Opérateur</label>
            <select v-model="brouillon.operateur" class="champ">
              <option v-for="op in operateursValides" :key="op" :value="op">{{ op }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Zone</label>
            <input v-model="brouillon.zone" required class="champ" placeholder="ex: Kinshasa - Gombe" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Date</label>
            <input v-model="brouillon.date" type="date" required class="champ" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Description</label>
            <textarea v-model="brouillon.description" required rows="4" class="champ"></textarea>
          </div>

          <p v-if="message" class="rounded-md px-3 py-2 text-sm" :class="succes ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
            {{ message }}
          </p>

          <button type="submit" class="bouton-primaire w-full" :disabled="envoiEnCours">
            {{ envoiEnCours ? "Envoi…" : "Déclarer l'intervention" }}
          </button>
        </form>

        <div class="mt-8">
          <p class="uni-label mb-3">Mes rapports récents</p>
          <div class="divide-y divide-uni-border">
            <p v-if="mesRapports.length === 0" class="py-3 text-sm text-uni-muted">Aucun rapport pour l'instant.</p>
            <div v-for="r in mesRapports" :key="r.id" class="py-3">
              <p class="text-sm text-uni-navy">{{ r.zone }}</p>
              <p class="uni-label">{{ formaterDate(r.date) }} — {{ r.operateur }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau de bord de consolidation (managers uniquement) -->
      <div v-if="peutConsulter" class="uni-card p-5">
        <p class="uni-label mb-4">
          Consolidation — {{ consolidationData?.totalRapports || 0 }} interventions (30 derniers jours)
        </p>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p class="mb-2 text-sm font-medium text-uni-navy">Par opérateur</p>
            <BarreStat v-for="(valeur, cle) in consolidationData?.parOperateur" :key="cle" :libelle="cle" :valeur="valeur" :max="maxOperateur" />
          </div>
          <div>
            <p class="mb-2 text-sm font-medium text-uni-navy">Par zone</p>
            <BarreStat v-for="(valeur, cle) in consolidationData?.parZone" :key="cle" :libelle="cle" :valeur="valeur" :max="maxZone" />
          </div>
        </div>

        <div class="mt-8">
          <p class="mb-2 text-sm font-medium text-uni-navy">Par technicien</p>
          <BarreStat v-for="(valeur, cle) in consolidationData?.parTechnicien" :key="cle" :libelle="cle" :valeur="valeur" :max="maxTechnicien" />
        </div>

        <p v-if="!consolidationData?.totalRapports" class="text-sm text-uni-muted">Aucune donnée sur la période.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, defineComponent } from "vue";
import { useAuthStore } from "../stores/auth";
import { rapportsService } from "../services/rapports.service";

// Barre de statistique minimaliste (évite une dépendance de charting pour un
// simple diagramme en barres horizontales).
const BarreStat = defineComponent({
  props: { libelle: String, valeur: Number, max: Number },
  setup(props) {
    return () =>
      h("div", { class: "mb-2" }, [
        h("div", { class: "mb-1 flex items-center justify-between text-xs" }, [
          h("span", { class: "text-uni-navy" }, props.libelle),
          h("span", { class: "font-mono text-uni-muted" }, props.valeur),
        ]),
        h("div", { class: "h-1.5 w-full rounded-full bg-uni-surface" }, [
          h("div", {
            class: "h-1.5 rounded-full bg-uni-purple",
            style: { width: `${props.max ? (props.valeur / props.max) * 100 : 0}%` },
          }),
        ]),
      ]);
  },
});

const auth = useAuthStore();
const peutConsulter = computed(() => auth.aLeRole(["ADMIN", "COUNTRY_MANAGER", "MANAGER_METIER", "CHEF_PROJET_MS"]));
const operateursValides = ["AIRTEL", "VODACOM", "ORANGE", "RCS", "FUEL"];

const brouillon = ref({ operateur: "AIRTEL", zone: "", date: new Date().toISOString().slice(0, 10), description: "" });
const message = ref("");
const succes = ref(false);
const envoiEnCours = ref(false);

const mesRapports = ref([]);
const consolidationData = ref(null);

function formaterDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

const maxOperateur = computed(() => Math.max(1, ...Object.values(consolidationData.value?.parOperateur || { a: 0 })));
const maxZone = computed(() => Math.max(1, ...Object.values(consolidationData.value?.parZone || { a: 0 })));
const maxTechnicien = computed(() => Math.max(1, ...Object.values(consolidationData.value?.parTechnicien || { a: 0 })));

async function soumettre() {
  message.value = "";
  envoiEnCours.value = true;
  try {
    await rapportsService.creer(brouillon.value);
    succes.value = true;
    message.value = "Rapport enregistré.";
    brouillon.value.zone = "";
    brouillon.value.description = "";
    await chargerDonnees();
  } catch (err) {
    succes.value = false;
    message.value = err.response?.data?.error || "Échec de l'enregistrement.";
  } finally {
    envoiEnCours.value = false;
  }
}

async function chargerDonnees() {
  mesRapports.value = await rapportsService.mesRapports();
  if (peutConsulter.value) {
    consolidationData.value = await rapportsService.consolidation();
  }
}

onMounted(chargerDonnees);
</script>
