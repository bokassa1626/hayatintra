import api from "./api";

export const rapportsService = {
  creer: (payload) => api.post("/rapports", payload).then((r) => r.data),
  mesRapports: () => api.get("/rapports/mes-rapports").then((r) => r.data),
  lister: () => api.get("/rapports").then((r) => r.data),
  consolidation: (depuis) =>
    api.get("/rapports/consolidation", { params: depuis ? { depuis } : {} }).then((r) => r.data),
};
