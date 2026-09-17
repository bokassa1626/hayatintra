const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const { listerAuditLogs, listerActionsDistinctes, exporterCSV } = require("../controllers/audit.controller");

const router = express.Router();

router.use(authenticate, checkPermission("READ", "AUDIT_LOG"));

router.get("/", listerAuditLogs);
router.get("/actions", listerActionsDistinctes);
router.get("/export.csv", exporterCSV);

module.exports = router;
