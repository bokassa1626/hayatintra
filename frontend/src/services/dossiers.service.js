import api from "./api";

export const dossiersService = {
  lister: () => api.get("/dossiers").then((r) => r.data),
  creer: (payload) => api.post("/dossiers", payload).then((r) => r.data),
  supprimer: (id) => api.delete(`/dossiers/${id}`),
};
