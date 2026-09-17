// ============================================================================
// Les téléchargements (pièces jointes, fichiers partagés, export CSV) passent
// par des routes protégées par JWT : un simple lien <a href> ne fonctionnerait
// pas (pas d'en-tête Authorization). On récupère donc le fichier en "blob"
// via Axios (qui, lui, ajoute le token), puis on déclenche le téléchargement
// manuellement dans le navigateur.
// ============================================================================
import api from "./api";

export async function telechargerFichierProtege(chemin, nomFichierParDefaut) {
  const response = await api.get(chemin, { responseType: "blob" });

  // Récupère le nom de fichier suggéré par le serveur (Content-Disposition),
  // sinon retombe sur le nom fourni par l'appelant.
  const dispositionEntete = response.headers["content-disposition"];
  let nomFichier = nomFichierParDefaut;
  const correspondance = dispositionEntete?.match(/filename="?([^"]+)"?/);
  if (correspondance) nomFichier = correspondance[1];

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}
