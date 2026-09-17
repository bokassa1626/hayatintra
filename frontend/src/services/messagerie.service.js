import api from "./api";

export const messagerieService = {
  annuaire: () => api.get("/messages/annuaire").then((r) => r.data),
  reception: () => api.get("/messages/reception").then((r) => r.data),
  envoyes: () => api.get("/messages/envoyes").then((r) => r.data),
  lire: (id) => api.get(`/messages/${id}`).then((r) => r.data),
  supprimer: (id) => api.delete(`/messages/${id}`),

  envoyer(payload) {
    const form = new FormData();
    form.append("sujet", payload.sujet);
    form.append("corps", payload.corps);
    form.append("destinataireIds", JSON.stringify(payload.destinataireIds));
    for (const fichier of payload.fichiers || []) {
      form.append("piecesJointes", fichier);
    }
    return api.post("/messages", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },

  urlTelechargementPieceJointe(id) {
    return `/messages/pieces-jointes/${id}/telecharger`;
  },
};
