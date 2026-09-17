const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const { uploadFichier } = require("../middleware/uploadFichier");
const {
  listerFichiers,
  uploaderFichier,
  historiqueFichier,
  telechargerVersion,
  telechargerFichier,
  renommerFichier,
  listerCorbeille,
  mettreALaCorbeille,
  restaurerFichier,
} = require("../controllers/fichier.controller");

const router = express.Router();

router.use(authenticate);

// Corbeille (avant "/:id" pour éviter tout conflit de route)
router.get("/corbeille", checkPermission("READ", "FICHIER"), listerCorbeille);

// Fichiers d'un dossier
router.get("/dossier/:dossierId", checkPermission("READ", "FICHIER"), listerFichiers);
router.post(
  "/dossier/:dossierId",
  checkPermission("CREATE", "FICHIER"),
  uploadFichier.single("fichier"),
  uploaderFichier
);

// Actions sur un fichier précis
router.get("/:id/telecharger", checkPermission("READ", "FICHIER"), telechargerFichier);
router.get("/:id/historique", checkPermission("READ", "FICHIER"), historiqueFichier);
router.get("/:id/version/:version", checkPermission("READ", "FICHIER"), telechargerVersion);
router.patch("/:id", checkPermission("CREATE", "FICHIER"), renommerFichier);
router.delete("/:id", checkPermission("DELETE", "FICHIER"), mettreALaCorbeille);
router.post("/:id/restaurer", checkPermission("DELETE", "FICHIER"), restaurerFichier);

module.exports = router;
