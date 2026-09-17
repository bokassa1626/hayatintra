const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { checkPermission } = require("../middleware/checkPermission");
const {
  listUsers,
  createUser,
  updateUserRole,
  toggleActif,
} = require("../controllers/user.controller");

const router = express.Router();

// Toutes les routes ci-dessous exigent MANAGE:USER (rôle ADMIN uniquement,
// voir seed.js — §3 du prompt maître).
router.use(authenticate, checkPermission("MANAGE", "USER"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/actif", toggleActif);

module.exports = router;
