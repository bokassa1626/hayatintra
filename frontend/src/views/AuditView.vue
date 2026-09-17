<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-uni-navy">Journal d'audit</h1>
      <button class="bouton-secondaire" @click="auditService.exporterCSV()">
        <Download class="h-4 w-4" />
        Exporter en CSV
      </button>
    </div>

    <div class="mt-6 flex flex-wrap items-end gap-3">
      <div>
        <label class="mb-1 block text-xs text-uni-muted">Action</label>
        <select v-model="filtres.action" class="champ" @change="charger">
          <option value="">Toutes</option>
          <option v-for="a in actionsDisponibles" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs text-uni-muted">Depuis</label>
        <input v-model="filtres.dateDebut" type="date" class="champ" @change="charger" />
      </div>
      <div>
        <label class="mb-1 block text-xs text-uni-muted">Jusqu'au</label>
        <input v-model="filtres.dateFin" type="date" class="champ" @change="charger" />
      </div>
    </div>

    <div class="mt-4 uni-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-uni-border text-xs text-uni-muted">
            <th class="px-4 py-3 font-medium">Date</th>
            <th class="px-4 py-3 font-medium">Utilisateur</th>
            <th class="px-4 py-3 font-medium">Action</th>
            <th class="px-4 py-3 font-medium">Ressource</th>
            <th class="px-4 py-3 font-medium">Détails</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-uni-border">
          <tr v-for="l in logs" :key="l.id">
            <td class="px-4 py-3 uni-label">{{ formaterDate(l.dateAction) }}</td>
            <td class="px-4 py-3 text-uni-navy">{{ l.user ? `${l.user.prenom} ${l.user.nom}` : "Système" }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-xs text-uni-navy">{{ l.action }}</span>
            </td>
            <td class="px-4 py-3 text-uni-muted">{{ l.ressource ? `${l.ressource}#${l.ressourceId ?? ""}` : "—" }}</td>
            <td class="px-4 py-3 text-uni-muted">{{ l.details || "—" }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="logs.length === 0" class="p-4 text-sm text-uni-muted">Aucune entrée pour ces filtres.</p>
    </div>

    <p class="mt-3 uni-label">{{ total }} entrée(s) au total</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Download } from "lucide-vue-next";
import { auditService } from "../services/audit.service";

const logs = ref([]);
const total = ref(0);
const actionsDisponibles = ref([]);
const filtres = ref({ action: "", dateDebut: "", dateFin: "" });

function formaterDate(date) {
  return new Date(date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

async function charger() {
  const filtresNettoyes = Object.fromEntries(Object.entries(filtres.value).filter(([, v]) => v));
  const data = await auditService.lister(filtresNettoyes);
  logs.value = data.logs;
  total.value = data.total;
}

onMounted(async () => {
  actionsDisponibles.value = await auditService.actions();
  await charger();
});
</script>
