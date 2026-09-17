<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-uni-navy">Messagerie</h1>
      <button class="bouton-primaire" @click="ouvrirComposition">
        <PenSquare class="h-4 w-4" />
        Nouveau message
      </button>
    </div>

    <div class="mt-6 flex gap-2 border-b border-uni-border">
      <button
        v-for="onglet in onglets"
        :key="onglet.cle"
        class="border-b-2 px-3 py-2 text-sm font-medium transition-colors"
        :class="ongletActif === onglet.cle ? 'border-uni-purple text-uni-navy' : 'border-transparent text-uni-muted hover:text-uni-navy'"
        @click="changerOnglet(onglet.cle)"
      >
        {{ onglet.libelle }}
      </button>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <!-- Liste des messages -->
      <div class="uni-card divide-y divide-uni-border">
        <p v-if="chargement" class="p-4 text-sm text-uni-muted">Chargement…</p>
        <p v-else-if="messagesAffiches.length === 0" class="p-4 text-sm text-uni-muted">Aucun message.</p>
        <button
          v-for="msg in messagesAffiches"
          :key="msg.id"
          class="flex w-full flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-uni-surface"
          :class="messageSelectionne?.id === msg.id ? 'bg-uni-surface' : ''"
          @click="selectionner(msg)"
        >
          <div class="flex w-full items-center justify-between">
            <span class="text-sm font-medium text-uni-navy" :class="{ 'font-semibold': ongletActif === 'reception' && !msg.lu }">
              {{ ongletActif === "reception" ? `${msg.expediteur.prenom} ${msg.expediteur.nom}` : destinatairesTexte(msg) }}
            </span>
            <span
              v-if="ongletActif === 'reception' && !msg.lu"
              class="h-2 w-2 flex-shrink-0 rounded-full bg-uni-purple"
            ></span>
          </div>
          <span class="truncate text-sm text-uni-navy">{{ msg.sujet }}</span>
          <span class="uni-label">{{ formaterDate(msg.dateEnvoi) }}</span>
        </button>
      </div>

      <!-- Détail du message -->
      <div class="uni-card p-6">
        <template v-if="messageSelectionne">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold text-uni-navy">{{ messageSelectionne.sujet }}</h2>
              <p class="mt-1 text-sm text-uni-muted">
                De {{ messageSelectionne.expediteur.prenom }} {{ messageSelectionne.expediteur.nom }} —
                {{ formaterDate(messageSelectionne.dateEnvoi) }}
              </p>
            </div>
            <button class="text-uni-muted transition-colors hover:text-red-600" title="Supprimer" @click="supprimer">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <p class="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-uni-navy">{{ messageSelectionne.corps }}</p>

          <div v-if="messageSelectionne.piecesJointes?.length" class="mt-6 space-y-2">
            <p class="uni-label">Pièces jointes</p>
            <button
              v-for="pj in messageSelectionne.piecesJointes"
              :key="pj.id"
              class="flex items-center gap-2 rounded-md border border-uni-border px-3 py-2 text-sm text-uni-navy transition-colors hover:border-uni-purple/50"
              @click="telechargerPieceJointe(pj)"
            >
              <Paperclip class="h-4 w-4 text-uni-muted" />
              {{ pj.nomFichier }}
            </button>
          </div>
        </template>
        <p v-else class="text-sm text-uni-muted">Sélectionnez un message pour l'afficher.</p>
      </div>
    </div>

    <!-- Panneau de composition -->
    <div v-if="compositionOuverte" class="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div class="w-full max-w-lg uni-card p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-uni-navy">Nouveau message</h2>
          <button class="text-uni-muted hover:text-uni-navy" @click="compositionOuverte = false"><X class="h-5 w-5" /></button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="envoyer">
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Destinataires</label>
            <select v-model="brouillon.destinataireIds" multiple class="champ h-28">
              <option v-for="u in annuaire" :key="u.id" :value="u.id">
                {{ u.prenom }} {{ u.nom }} — {{ u.email }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Sujet</label>
            <input v-model="brouillon.sujet" required class="champ" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Message</label>
            <textarea v-model="brouillon.corps" required rows="5" class="champ"></textarea>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-uni-navy">Pièces jointes (optionnel)</label>
            <input type="file" multiple class="text-sm" @change="onFichiersChoisis" />
          </div>

          <p v-if="erreurEnvoi" class="rounded-md bg-bad/10 px-3 py-2 text-sm text-red-600">{{ erreurEnvoi }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="bouton-secondaire" @click="compositionOuverte = false">Annuler</button>
            <button type="submit" class="bouton-primaire" :disabled="envoiEnCours">
              {{ envoiEnCours ? "Envoi…" : "Envoyer" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { PenSquare, Trash2, Paperclip, X } from "lucide-vue-next";
import { messagerieService } from "../services/messagerie.service";
import { telechargerFichierProtege } from "../services/telechargement";
import { useMessagerieStore } from "../stores/messagerie";
import { getSocket } from "../services/socket";

const messagerieStore = useMessagerieStore();

const onglets = [
  { cle: "reception", libelle: "Réception" },
  { cle: "envoyes", libelle: "Envoyés" },
];
const ongletActif = ref("reception");

const reception = ref([]);
const envoyes = ref([]);
const annuaire = ref([]);
const messageSelectionne = ref(null);
const chargement = ref(true);

const compositionOuverte = ref(false);
const envoiEnCours = ref(false);
const erreurEnvoi = ref("");
const brouillon = ref({ destinataireIds: [], sujet: "", corps: "" });
const fichiersJoints = ref([]);

const messagesAffiches = computed(() => (ongletActif.value === "reception" ? reception.value : envoyes.value));

function formaterDate(date) {
  return new Date(date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function destinatairesTexte(msg) {
  return msg.destinataires.map((d) => `${d.destinataire.prenom} ${d.destinataire.nom}`).join(", ");
}

async function chargerTout() {
  chargement.value = true;
  [reception.value, envoyes.value] = await Promise.all([messagerieService.reception(), messagerieService.envoyes()]);
  chargement.value = false;
}

function changerOnglet(cle) {
  ongletActif.value = cle;
  messageSelectionne.value = null;
}

async function selectionner(msg) {
  const etaitNonLu = ongletActif.value === "reception" && !msg.lu;
  messageSelectionne.value = await messagerieService.lire(msg.id);
  if (etaitNonLu) {
    msg.lu = true;
    messagerieStore.reinitialiserApresLecture(1);
  }
}

async function supprimer() {
  if (!messageSelectionne.value) return;
  await messagerieService.supprimer(messageSelectionne.value.id);
  messageSelectionne.value = null;
  await chargerTout();
}

function telechargerPieceJointe(pj) {
  telechargerFichierProtege(messagerieService.urlTelechargementPieceJointe(pj.id), pj.nomFichier);
}

async function ouvrirComposition() {
  compositionOuverte.value = true;
  erreurEnvoi.value = "";
  brouillon.value = { destinataireIds: [], sujet: "", corps: "" };
  fichiersJoints.value = [];
  if (annuaire.value.length === 0) {
    annuaire.value = await messagerieService.annuaire();
  }
}

function onFichiersChoisis(evenement) {
  fichiersJoints.value = Array.from(evenement.target.files);
}

async function envoyer() {
  erreurEnvoi.value = "";
  if (brouillon.value.destinataireIds.length === 0) {
    erreurEnvoi.value = "Choisissez au moins un destinataire.";
    return;
  }
  envoiEnCours.value = true;
  try {
    await messagerieService.envoyer({ ...brouillon.value, fichiers: fichiersJoints.value });
    compositionOuverte.value = false;
    await chargerTout();
  } catch (err) {
    erreurEnvoi.value = err.response?.data?.error || "Échec de l'envoi.";
  } finally {
    envoiEnCours.value = false;
  }
}

onMounted(() => {
  chargerTout();

  // Rafraîchit la boîte de réception dès qu'une notification arrive.
  const socket = getSocket();
  socket?.on("nouveau_message", () => {
    if (ongletActif.value === "reception") chargerTout();
  });
});
</script>
