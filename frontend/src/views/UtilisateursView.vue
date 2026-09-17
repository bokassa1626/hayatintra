<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-uni-navy">Utilisateurs</h1>
      <button class="bouton-primaire" @click="ouvrirCreation">
        <UserPlus class="h-4 w-4" />
        Nouvel utilisateur
      </button>
    </div>

    <div class="mt-6 uni-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-uni-border text-xs text-uni-muted">
            <th class="px-4 py-3 font-medium">Nom</th>
            <th class="px-4 py-3 font-medium">Email</th>
            <th class="px-4 py-3 font-medium">Rôle</th>
            <th class="px-4 py-3 font-medium">Opérateur</th>
            <th class="px-4 py-3 font-medium">Statut</th>
            <th class="px-4 py-3 font-medium">Dernière connexion</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-uni-border">
          <tr v-for="u in utilisateurs" :key="u.id">
            <td class="px-4 py-3 text-uni-navy">{{ u.prenom }} {{ u.nom }}</td>
            <td class="px-4 py-3 text-uni-muted">{{ u.email }}</td>
            <td class="px-4 py-3">
              <select class="champ !py-1 text-xs" :value="u.role" @change="changerRole(u, $event.target.value)">
                <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
              </select>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-uni-muted">{{ u.operateur }}</td>
            <td class="px-4 py-3">
              <button
                class="rounded-full px-2 py-0.5 font-mono text-xs"
                :class="u.actif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
                @click="basculerActif(u)"
              >
                {{ u.actif ? "actif" : "désactivé" }}
              </button>
            </td>
            <td class="px-4 py-3 uni-label">
              {{ u.derniereConnexion ? formaterDate(u.derniereConnexion) : "jamais" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modale : création d'utilisateur -->
    <div v-if="creationOuverte" class="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div class="w-full max-w-md uni-card p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-uni-navy">Nouvel utilisateur</h2>
          <button class="text-uni-muted hover:text-uni-navy" @click="creationOuverte = false"><X class="h-5 w-5" /></button>
        </div>

        <form class="mt-4 space-y-3" @submit.prevent="creer">
          <div class="grid grid-cols-2 gap-3">
            <input v-model="nouveau.prenom" required class="champ" placeholder="Prénom" />
            <input v-model="nouveau.nom" required class="champ" placeholder="Nom" />
          </div>
          <input v-model="nouveau.email" type="email" required class="champ" placeholder="Email" />
          <input v-model="nouveau.motDePasse" type="password" required class="champ" placeholder="Mot de passe provisoire" />
          <select v-model="nouveau.roleNom" required class="champ">
            <option value="" disabled>Rôle</option>
            <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
          </select>
          <select v-model="nouveau.direction" required class="champ">
            <option value="" disabled>Direction</option>
            <option v-for="d in DIRECTIONS" :key="d" :value="d">{{ d.replaceAll("_", " ") }}</option>
          </select>
          <select v-model="nouveau.operateur" class="champ">
            <option v-for="o in OPERATEURS" :key="o" :value="o">{{ o }}</option>
          </select>

          <p v-if="erreur" class="rounded-md bg-bad/10 px-3 py-2 text-sm text-red-600">{{ erreur }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="bouton-secondaire" @click="creationOuverte = false">Annuler</button>
            <button type="submit" class="bouton-primaire" :disabled="creationEnCours">
              {{ creationEnCours ? "Création…" : "Créer" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { UserPlus, X } from "lucide-vue-next";
import { utilisateursService, ROLES, DIRECTIONS, OPERATEURS } from "../services/utilisateurs.service";

const utilisateurs = ref([]);

const creationOuverte = ref(false);
const creationEnCours = ref(false);
const erreur = ref("");
const nouveau = ref({ prenom: "", nom: "", email: "", motDePasse: "", roleNom: "", direction: "", operateur: "AUCUN" });

function formaterDate(date) {
  return new Date(date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

async function charger() {
  utilisateurs.value = await utilisateursService.lister();
}

async function changerRole(u, roleNom) {
  await utilisateursService.changerRole(u.id, roleNom);
  await charger();
}

async function basculerActif(u) {
  await utilisateursService.changerActif(u.id, !u.actif);
  await charger();
}

function ouvrirCreation() {
  erreur.value = "";
  nouveau.value = { prenom: "", nom: "", email: "", motDePasse: "", roleNom: "", direction: "", operateur: "AUCUN" };
  creationOuverte.value = true;
}

async function creer() {
  erreur.value = "";
  creationEnCours.value = true;
  try {
    await utilisateursService.creer(nouveau.value);
    creationOuverte.value = false;
    await charger();
  } catch (err) {
    erreur.value = err.response?.data?.error || "Échec de la création.";
  } finally {
    creationEnCours.value = false;
  }
}

onMounted(charger);
</script>
