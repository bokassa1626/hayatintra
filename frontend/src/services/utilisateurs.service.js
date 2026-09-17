import api from "./api";

export const utilisateursService = {
  lister: () => api.get("/users").then((r) => r.data),
  creer: (payload) => api.post("/users", payload).then((r) => r.data),
  changerRole: (id, roleNom) => api.patch(`/users/${id}/role`, { roleNom }),
  changerActif: (id, actif) => api.patch(`/users/${id}/actif`, { actif }),
};

export const ROLES = ["ADMIN", "COUNTRY_MANAGER", "MANAGER_METIER", "CHEF_PROJET_MS", "FME", "WAREHOUSE"];
export const DIRECTIONS = [
  "DIRECTION_PAYS",
  "REGIONALE",
  "COMMERCIALE",
  "FINANCE",
  "RESSOURCES_HUMAINES",
  "QUALITE",
  "OPERATIONS_MS",
  "ENTREPOT",
  "TERRAIN_FME",
];
export const OPERATEURS = ["AIRTEL", "VODACOM", "ORANGE", "RCS", "FUEL", "AUCUN"];
