const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const { listerDossiers, creerDossier, supprimerDossier } = require("../controllers/dossier.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", checkPermission("READ", "DOSSIER"), listerDossiers);
router.post("/", checkPermission("CREATE", "DOSSIER"), creerDossier);
router.delete("/:id", checkPermission("DELETE", "DOSSIER"), supprimerDossier);

module.exports = router;
