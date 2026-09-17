import api from "./api";
import { telechargerFichierProtege } from "./telechargement";

export const fichiersService = {
  listerParDossier: (dossierId) => api.get(`/fichiers/dossier/${dossierId}`).then((r) => r.data),
  corbeille: () => api.get("/fichiers/corbeille").then((r) => r.data),
  historique: (id) => api.get(`/fichiers/${id}/historique`).then((r) => r.data),
  renommer: (id, nom) => api.patch(`/fichiers/${id}`, { nom }).then((r) => r.data),
  mettreALaCorbeille: (id) => api.delete(`/fichiers/${id}`),
  restaurer: (id) => api.post(`/fichiers/${id}/restaurer`),

  uploader(dossierId, fichier) {
    const form = new FormData();
    form.append("fichier", fichier);
    return api
      .post(`/fichiers/dossier/${dossierId}`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },

  telecharger: (id, nom) => telechargerFichierProtege(`/fichiers/${id}/telecharger`, nom),
  telechargerVersion: (id, version, nom) =>
    telechargerFichierProtege(`/fichiers/${id}/version/${version}`, nom),
};
