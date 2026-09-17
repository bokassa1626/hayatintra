<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-uni-navy">Fichiers</h1>
      <button class="bouton-secondaire" @click="ongletCorbeille = !ongletCorbeille">
        <Trash2 class="h-4 w-4" />
        {{ ongletCorbeille ? "Retour aux dossiers" : "Corbeille" }}
      </button>
    </div>

    <!-- Vue Corbeille -->
    <div v-if="ongletCorbeille" class="mt-6 uni-card divide-y divide-uni-border">
      <p v-if="corbeille.length === 0" class="p-4 text-sm text-uni-muted">La corbeille est vide.</p>
      <div v-for="f in corbeille" :key="f.id" class="flex items-center justify-between p-4">
        <div>
          <p class="text-sm font-medium text-uni-navy">{{ f.nom }}</p>
          <p class="uni-label">version {{ f.version }} — {{ formaterTaille(f.taille) }}</p>
        </div>
        <button class="bouton-secondaire" @click="restaurer(f)">Restaurer</button>
      </div>
    </div>

    <!-- Vue normale : dossiers + fichiers -->
    <div v-else class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <!-- Arborescence -->
      <div class="uni-card p-3">
        <div class="mb-2 flex items-center justify-between px-1">
          <p class="uni-label">Dossiers</p>
          <button class="text-uni-muted transition-colors hover:text-uni-purple" title="Nouveau dossier" @click="ouvrirCreationDossier">
            <FolderPlus class="h-4 w-4" />
          </button>
        </div>
        <ArbreDossier
          v-for="racine in arborescence"
          :key="racine.id"
          :dossier="racine"
          :selectionne-id="dossierSelectionne?.id"
          @selectionner="selectionnerDossier"
        />
        <p v-if="arborescence.length === 0" class="px-2 py-4 text-sm text-uni-muted">Aucun dossier accessible.</p>
      </div>

      <!-- Fichiers du dossier sélectionné -->
      <div class="uni-card p-5">
        <template v-if="dossierSelectionne">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-uni-navy">{{ dossierSelectionne.nom }}</p>
              <p class="uni-label">{{ dossierSelectionne.operateur !== "AUCUN" ? dossierSelectionne.operateur : "Transverse" }}</p>
            </div>
            <div class="flex items-center gap-2">
              <label class="bouton-primaire cursor-pointer">
                <Upload class="h-4 w-4" />
                Ajouter un fichier
                <input type="file" class="hidden" @change="uploaderFichier" />
              </label>
              <button
                v-if="!dossierSelectionne.enfants?.length && fichiers.length === 0"
                class="text-uni-muted transition-colors hover:text-red-600"
                title="Supprimer ce dossier"
                @click="supprimerDossier"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="mt-4 divide-y divide-uni-border">
            <p v-if="chargementFichiers" class="py-4 text-sm text-uni-muted">Chargement…</p>
            <p v-else-if="fichiers.length === 0" class="py-4 text-sm text-uni-muted">Aucun fichier dans ce dossier.</p>
            <div v-for="f in fichiers" :key="f.id" class="flex items-center justify-between py-3">
              <div class="flex items-center gap-3">
                <FileText class="h-4 w-4 text-uni-muted" />
                <div>
                  <p class="text-sm text-uni-navy">{{ f.nom }}</p>
                  <p class="uni-label">v{{ f.version }} — {{ formaterTaille(f.taille) }} — {{ formaterDate(f.dateAjout) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button class="text-uni-muted transition-colors hover:text-uni-navy" title="Historique des versions" @click="voirHistorique(f)">
                  <History class="h-4 w-4" />
                </button>
                <button class="text-uni-muted transition-colors hover:text-uni-navy" title="Télécharger" @click="fichiersService.telecharger(f.id, f.nom)">
                  <Download class="h-4 w-4" />
                </button>
                <button class="text-uni-muted transition-colors hover:text-red-600" title="Supprimer" @click="supprimerFichier(f)">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </template>
        <p v-else class="text-sm text-uni-muted">Sélectionnez un dossier pour voir son contenu.</p>
      </div>
    </div>

    <!-- Modale : nouveau dossier -->
    <div v-if="creationDossierOuverte" class="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div class="w-full max-w-sm uni-card p-6">
        <h2 class="text-lg font-semibold text-uni-navy">Nouveau dossier</h2>
        <form class="mt-4 space-y-4" @submit.prevent="creerDossier">
          <input v-model="nomNouveauDossier" required class="champ" placeholder="Nom du dossier" />
          <div class="flex justify-end gap-2">
            <button type="button" class="bouton-secondaire" @click="creationDossierOuverte = false">Annuler</button>
            <button type="submit" class="bouton-primaire">Créer</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modale : historique des versions -->
    <div v-if="historiqueOuvert" class="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div class="w-full max-w-md uni-card p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-uni-navy">Historique — {{ historiqueCourant?.nom }}</h2>
          <button class="text-uni-muted hover:text-uni-navy" @click="historiqueOuvert = false"><X class="h-5 w-5" /></button>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center justify-between rounded-md border border-uni-purple/40 bg-uni-purple/5 px-3 py-2">
            <span class="text-sm text-uni-navy">Version {{ historiqueCourant?.versionCourante }} (actuelle)</span>
          </div>
          <div
            v-for="v in historiqueCourant?.versionsPrecedentes"
            :key="v.version"
            class="flex items-center justify-between rounded-md border border-uni-border px-3 py-2"
          >
            <span class="text-sm text-uni-navy">Version {{ v.version }} — {{ formaterDate(v.dateAjout) }}</span>
            <button
              class="text-uni-muted transition-colors hover:text-uni-navy"
              @click="fichiersService.telechargerVersion(fichierHistoriqueId, v.version, `v${v.version}-${historiqueCourant.nom}`)"
            >
              <Download class="h-4 w-4" />
            </button>
          </div>
          <p v-if="!historiqueCourant?.versionsPrecedentes?.length" class="text-sm text-uni-muted">
            Aucune version antérieure conservée.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, defineComponent } from "vue";
import { FolderPlus, Upload, FileText, Download, Trash2, History, X, Folder } from "lucide-vue-next";
import { dossiersService } from "../services/dossiers.service";
import { fichiersService } from "../services/fichiers.service";

// Petit composant récursif pour afficher l'arborescence (dossiers imbriqués).
const ArbreDossier = defineComponent({
  name: "ArbreDossier",
  props: { dossier: Object, selectionneId: Number, profondeur: { type: Number, default: 0 } },
  emits: ["selectionner"],
  setup(props, { emit }) {
    return () =>
      h("div", [
        h(
          "button",
          {
            class: [
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              props.selectionneId === props.dossier.id ? "bg-uni-purple/10 text-uni-navy" : "text-uni-muted hover:bg-uni-surface hover:text-uni-navy",
            ],
            style: { paddingLeft: `${8 + props.profondeur * 14}px` },
            onClick: () => emit("selectionner", props.dossier),
          },
          [h(Folder, { class: "h-4 w-4 flex-shrink-0" }), h("span", { class: "truncate" }, props.dossier.nom)]
        ),
        ...(props.dossier.enfants || []).map((enfant) =>
          h(ArbreDossier, {
            dossier: enfant,
            selectionneId: props.selectionneId,
            profondeur: props.profondeur + 1,
            onSelectionner: (d) => emit("selectionner", d),
          })
        ),
      ]);
  },
});

const dossiersPlats = ref([]);
const dossierSelectionne = ref(null);
const fichiers = ref([]);
const chargementFichiers = ref(false);
const ongletCorbeille = ref(false);
const corbeille = ref([]);

const creationDossierOuverte = ref(false);
const nomNouveauDossier = ref("");

const historiqueOuvert = ref(false);
const historiqueCourant = ref(null);
const fichierHistoriqueId = ref(null);

/** Reconstruit une arborescence (parentId) à partir de la liste plate renvoyée par l'API. */
const arborescence = computed(() => {
  const parId = new Map(dossiersPlats.value.map((d) => [d.id, { ...d, enfants: [] }]));
  const racines = [];
  for (const d of parId.values()) {
    if (d.parentId && parId.has(d.parentId)) {
      parId.get(d.parentId).enfants.push(d);
    } else {
      racines.push(d);
    }
  }
  return racines;
});

function formaterTaille(octets) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

function formaterDate(date) {
  return new Date(date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

async function chargerDossiers() {
  dossiersPlats.value = await dossiersService.lister();
}

async function chargerCorbeille() {
  corbeille.value = await fichiersService.corbeille();
}

async function selectionnerDossier(dossier) {
  dossierSelectionne.value = dossier;
  chargementFichiers.value = true;
  fichiers.value = await fichiersService.listerParDossier(dossier.id);
  chargementFichiers.value = false;
}

function ouvrirCreationDossier() {
  nomNouveauDossier.value = "";
  creationDossierOuverte.value = true;
}

async function creerDossier() {
  await dossiersService.creer({
    nom: nomNouveauDossier.value,
    parentId: dossierSelectionne.value?.id || null,
  });
  creationDossierOuverte.value = false;
  await chargerDossiers();
}

async function supprimerDossier() {
  if (!confirm(`Supprimer le dossier "${dossierSelectionne.value.nom}" ?`)) return;
  await dossiersService.supprimer(dossierSelectionne.value.id);
  dossierSelectionne.value = null;
  fichiers.value = [];
  await chargerDossiers();
}

async function uploaderFichier(evenement) {
  const fichier = evenement.target.files[0];
  if (!fichier || !dossierSelectionne.value) return;
  await fichiersService.uploader(dossierSelectionne.value.id, fichier);
  fichiers.value = await fichiersService.listerParDossier(dossierSelectionne.value.id);
  evenement.target.value = "";
}

async function supprimerFichier(f) {
  await fichiersService.mettreALaCorbeille(f.id);
  fichiers.value = fichiers.value.filter((x) => x.id !== f.id);
}

async function restaurer(f) {
  await fichiersService.restaurer(f.id);
  await chargerCorbeille();
}

async function voirHistorique(f) {
  fichierHistoriqueId.value = f.id;
  historiqueCourant.value = await fichiersService.historique(f.id);
  historiqueCourant.value.nom = f.nom;
  historiqueOuvert.value = true;
}

onMounted(async () => {
  await chargerDossiers();
  await chargerCorbeille();
});
</script>
