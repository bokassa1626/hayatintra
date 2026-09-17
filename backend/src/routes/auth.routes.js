const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, refresh, logout, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Limite le brute-force sur le login (recommandation OWASP, §2.3.1 du rapport)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Trop de tentatives de connexion. Réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

module.exports = router;
