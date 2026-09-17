import api from "./api";
import { telechargerFichierProtege } from "./telechargement";

export const auditService = {
  lister: (filtres = {}) => api.get("/audit", { params: filtres }).then((r) => r.data),
  actions: () => api.get("/audit/actions").then((r) => r.data),
  exporterCSV: () => telechargerFichierProtege("/audit/export.csv", "journal_audit.csv"),
};
