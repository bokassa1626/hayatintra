const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const { creerRapport, mesRapports, listerRapports, consolidation } = require("../controllers/rapport.controller");

const router = express.Router();

router.use(authenticate);

router.post("/", checkPermission("CREATE", "RAPPORT"), creerRapport);
router.get("/mes-rapports", mesRapports); // accessible à tous (données propres)
router.get("/", checkPermission("READ", "RAPPORT"), listerRapports);
router.get("/consolidation", checkPermission("READ", "RAPPORT"), consolidation);

module.exports = router;
