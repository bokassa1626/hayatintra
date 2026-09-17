const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const { listerNoeuds, basculerActif, metriquesSimulees } = require("../controllers/reseau.controller");

const router = express.Router();

router.use(authenticate);
router.get("/noeuds", listerNoeuds);
router.patch("/noeuds/:id", checkPermission("MANAGE", "NOEUD_RESEAU"), basculerActif);
router.get("/metriques", checkPermission("MANAGE", "NOEUD_RESEAU"), metriquesSimulees);

module.exports = router;
