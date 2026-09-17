const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const { uploadMessage } = require("../middleware/upload");
const {
  annuaire,
  envoyerMessage,
  reception,
  envoyes,
  lireMessage,
  supprimerMessage,
  telechargerPieceJointe,
} = require("../controllers/message.controller");

const router = express.Router();

router.use(authenticate);

router.get("/annuaire", annuaire);

router.get("/reception", checkPermission("READ", "MESSAGE"), reception);
router.get("/envoyes", checkPermission("READ", "MESSAGE"), envoyes);
router.get("/:id", checkPermission("READ", "MESSAGE"), lireMessage);

router.post(
  "/",
  checkPermission("CREATE", "MESSAGE"),
  uploadMessage.array("piecesJointes", 5), // jusqu'à 5 pièces jointes
  envoyerMessage
);

router.delete("/:id", checkPermission("READ", "MESSAGE"), supprimerMessage);

router.get("/pieces-jointes/:id/telecharger", telechargerPieceJointe);

module.exports = router;
